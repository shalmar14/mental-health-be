import { spawn, execFile } from "child_process";
import db from "../config/db.js"; // ganti sesuai koneksi MySQL-mu
import path from "path";

export const predictAnswersPHQ = async (req, res) => {
  const userId = req.user?.id;

  try {
    const [rows] = await db.query("SELECT answers FROM questionnaire_answers_phq WHERE user_id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "Jawaban belum ditemukan." });

    const phq9Answers = JSON.parse(rows[0].answers); 

    if (phq9Answers.length !== 9 || !phq9Answers.every(n => typeof n === "number" && n >= 0 && n <= 3)) {
      return res.status(400).json({ message: "Data jawaban tidak valid." });
    }

   // Jalankan Python script
    const python = spawn("python", [path.resolve("src/models/calculatePHQ.py"), JSON.stringify(phq9Answers)]);

    let output = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    python.on("close", async () => {
      try {
        const result = JSON.parse(output);
        if (result.error) return res.status(400).json({ message: result.error });

        const { total_score, result: diagnosis } = result;

        // 4. Cek apakah user sudah memiliki diagnosis
        const [existingDiagnosis] = await db.query("SELECT id FROM diagnosis_phq WHERE user_id = ?", [userId]);

        if (existingDiagnosis.length > 0) {
          // 5. Update diagnosis yang sudah ada
          await db.query(
            "UPDATE diagnosis_phq SET total_score = ?, result = ? WHERE user_id = ?",
            [total_score, diagnosis, userId]
          );
          return res.status(200).json({ message: "Prediksi berhasil diperbarui", total_score, diagnosis });
        } else {
          // 6. Simpan diagnosis baru
          await db.query(
            "INSERT INTO diagnosis_phq (user_id, total_score, result) VALUES (?, ?, ?)",
            [userId, total_score, diagnosis]
          );
          return res.status(200).json({ message: "Prediksi berhasil", total_score, diagnosis });
        }
      } catch (err) {
        console.error("Parse error:", err);
        return res.status(500).json({ message: "Gagal memproses hasil prediksi." });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

 export const getPredictionPHQByUser = async (req, res) => {
    try {
      const userId = req.user.id; 
  
      // Query untuk mendapatkan hasil prediksi dari database
      const [result] = await db.query(
        "SELECT id, total_score, result FROM diagnosis_phq WHERE user_id = ?", [userId]
      );
  
      if (result.length === 0) {
        return res.status(404).json({ message: "Tidak ada hasil prediksi ditemukan" });
      }
  
      const diagnosis = result[0];
  
      // Pastikan total_score dan result tidak NULL
      if (diagnosis.total_score === null || diagnosis.result === null) {
        return res.status(400).json({ message: "Data prediksi tidak lengkap" });
      }
  
      // Kirimkan hasil diagnosa
      res.status(200).json({ prediction: diagnosis });
    } catch (err) {
      console.error("Error saat mengambil prediksi:", err);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil data prediksi" });
    }
  };

  export const predictAnswersCART = async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User tidak terautentikasi." });
      }
  
      const [rows] = await db.query(
        "SELECT answers FROM questionnaire_answers_cart WHERE user_id = ?",
        [userId]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "Jawaban belum tersedia." });
      }
  
      const userAnswers = JSON.parse(rows[0].answers);
  
      if (userAnswers.length !== 14) {
        return res.status(400).json({ message: "Data jawaban tidak valid (harus 14 jawaban)." });
      }
      
      const pythonPath = "python"; // atau "python3"
      const scriptPath = path.resolve("src", "models", "predict_decision_tree.py");
  
      const args = [scriptPath, JSON.stringify(userAnswers)];
  
      execFile(pythonPath, args, (err, stdout, stderr) => {
        if (err) {
          console.error("Python exec error:", err);
          console.error("stderr:", stderr);
          return res.status(500).json({
            message: "Gagal menjalankan prediksi.",
            detail: stderr || err.message
          });
        }
  
        if (!stdout) {
          console.error("Python tidak mengembalikan output.");
          console.error("stderr:", stderr);
          return res.status(500).json({
            message: "Tidak ada output dari Python.",
            detail: stderr
          });
        }
  
        try {
          const cleanedOutput = stdout.trim().split('\n').pop();
          const result = JSON.parse(cleanedOutput);
          console.log(result);
  
          if (result.error) {
            return res.status(500).json({ message: "Error dari Python", detail: result.error });
          }
  
          const totalScore = userAnswers.reduce((sum, val) => sum + val, 0);
          const diagnosis = result.diagnosis;
  
          db.query("SELECT id FROM diagnosis_cart WHERE user_id = ?", [userId], async (err, existing) => {
            if (err) {
              console.error("DB error:", err.message);
              return res.status(500).json({ message: "Kesalahan database." });
            }
  
            if (existing.length > 0) {
              await db.query(
                "UPDATE diagnosis_cart SET total_score = ?, result = ? WHERE user_id = ?",
                [totalScore, diagnosis, userId]
              );
            } else {
              await db.query(
                "INSERT INTO diagnosis_cart (user_id, total_score, result) VALUES (?, ?, ?)",
                [userId, totalScore, diagnosis]
              );
            }
  
            res.status(200).json({
              message: "Prediksi berhasil.",
              total_score: totalScore,
              result: diagnosis
            });
          });
        } catch (parseError) {
          console.error("Gagal parsing hasil dari Python:", parseError.message);
          console.error("stdout dari Python:", stdout);
          return res.status(500).json({
            message: "Gagal membaca hasil prediksi dari Python.",
            detail: parseError.message
          });
        }
      });
    } catch (err) {
      console.error("Server error:", err.message);
      res.status(500).json({ message: "Terjadi kesalahan server." });
    }
  };