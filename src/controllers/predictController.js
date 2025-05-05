import { spawn, execFile } from "child_process";
import db from "../config/db.js"; 
import path from "path";

export const predictAnswersPHQ = async (req, res) => {
  const userId = req.user?.id;
  const name = req.user?.name;

  try {
    const [rows] = await db.query("SELECT answers FROM questionnaire_answers_phq WHERE user_id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "Jawaban belum ditemukan." });

    const phq9Answers = JSON.parse(rows[0].answers); 

    if (phq9Answers.length !== 9 || !phq9Answers.every(n => typeof n === "number" && n >= 0 && n <= 3)) {
      return res.status(400).json({ message: "Data jawaban tidak valid." });
    }

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
        const [existingDiagnosis] = await db.query("SELECT id FROM diagnosis_phq WHERE user_id = ?", [userId]);

        if (existingDiagnosis.length > 0) {
          await db.query(
            "UPDATE diagnosis_phq SET total_score = ?, result = ? WHERE user_id = ?",
            [total_score, diagnosis, userId]
          );
          return res.status(200).json({ message: "Prediksi berhasil diperbarui", total_score, diagnosis });
        } else {
          await db.query(
            "INSERT INTO diagnosis_phq (user_id, name, total_score, result) VALUES (?, ?, ?, ?)",
            [userId, name, total_score, diagnosis]
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
  
      const [result] = await db.query(
        "SELECT id, total_score, result FROM diagnosis_phq WHERE user_id = ?", [userId]
      );
  
      if (result.length === 0) {
        return res.status(404).json({ message: "Tidak ada hasil prediksi ditemukan" });
      }
  
      const diagnosis = result[0];

      if (diagnosis.total_score === null || diagnosis.result === null) {
        return res.status(400).json({ message: "Data prediksi tidak lengkap" });
      }
  
      res.status(200).json({ predictionPHQ: diagnosis });
    } catch (err) {
      console.error("Error saat mengambil prediksi:", err);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil data prediksi" });
    }
  };


  export const predictAnswersCART = async (req, res) => {
    const userId = req.user?.id;
    const name = req.user?.name;

    try {
      const [rows] = await db.query("SELECT answers FROM questionnaire_answers_cart WHERE user_id = ?", [userId]);

      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Jawaban tidak ditemukan." });
      }

      const answers = JSON.parse(rows[0].answers);

      const python = spawn("python", ["src/models/predict_decision_tree.py", JSON.stringify(answers)]);

      let result = "";
      python.stdout.on("data", (data) => {
        result += data.toString();
      });

      python.stderr.on("data", (data) => {
        console.error("Python error:", data.toString());
      });

      python.on("close", async (code) => {
        try {
          const parsed = JSON.parse(result);

          const [existing] = await db.query("SELECT result FROM diagnosis_cart WHERE user_id = ?", [userId]);

          if (existing.length === 0) {
            await db.query(
              "INSERT INTO diagnosis_cart (user_id, name, result, message) VALUES (?, ?, ?, ?)",
              [userId, name, parsed.result, parsed.message]
            );

          } else {
            await db.query(
              "UPDATE diagnosis_cart SET result = ?, message = ? WHERE user_id = ?",
              [parsed.result, parsed.message, userId]
            );
          }

          return res.status(200).json({
            message: "Prediksi berhasil",
            result: parsed.result,
            diagnosis: parsed.message,
          });

        } catch (err) {
          return res.status(500).json({ message: "Gagal memproses hasil prediksi.", error: err.message });
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Terjadi kesalahan.", error: error.message });
    }
  };

  export const getPredictionCARTByUser = async (req, res) => {
    try {
      const userId = req.user.id; 
  
      const [result] = await db.query(
        "SELECT id, result, message FROM diagnosis_cart WHERE user_id = ?", [userId]
      );
  
      if (result.length === 0) {
        return res.status(404).json({ message: "Tidak ada hasil prediksi ditemukan" });
      }
  
      const diagnosis = result[0];

      if (diagnosis.message === null || diagnosis.result === null) {
        return res.status(400).json({ message: "Data prediksi tidak lengkap" });
      }
  
      res.status(200).json({ predictionCART: diagnosis });
    } catch (err) {
      console.error("Error saat mengambil prediksi:", err);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil data prediksi" });
    }
  };