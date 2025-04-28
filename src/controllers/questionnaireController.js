import db from "../config/db.js";
import { mapAnswerToScorePHQ, mapAnswerToScoreCART } from "../utils/mapper.js"

export const submitAnswersPHQ = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    if (!Array.isArray(answers) || answers.length !== 11) {
      return res.status(400).json({
        message: "Jawaban tidak lengkap! Harus ada 11 jawaban."
      });
    }

    // 🔁 Konversi teks ke angka
    const numericAnswers = answers.map(mapAnswerToScorePHQ);

    if (numericAnswers.includes(-1)) {
      return res.status(400).json({ message: "Terdapat jawaban tidak valid." });
    }
    
    // 💡 Ambil hanya 9 jawaban (indeks 0-7 dan indeks 10)
    const phq9Answers = [...numericAnswers.slice(0, 8), numericAnswers[10]];
    
    // Simpan hanya phq9Answers ke DB
    const [existing] = await db.query(
      "SELECT id FROM questionnaire_answers_phq WHERE user_id = ?",
      [userId]
    );
    
    if (existing.length > 0) {
      await db.query(
        "UPDATE questionnaire_answers_phq SET answers = ? WHERE user_id = ?",
        [JSON.stringify(phq9Answers), userId]
      );
      return res.status(200).json({ message: "Jawaban berhasil diperbarui.", action: "update" });
    }
    
    await db.query(
      "INSERT INTO questionnaire_answers_phq (user_id, answers) VALUES (?, ?)",
      [userId, JSON.stringify(phq9Answers)]
    );
    
    res.status(200).json({ message: "Jawaban berhasil disimpan.", action: "insert" });
  } catch (error) {
    console.error("❌ Error saat menyimpan kuisioner:", error.message);
    res.status(500).json({ message: "Terjadi kesalahan di server.", error: error.message });
  }
};

export const submitAnswersCART = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    if (!Array.isArray(answers) || answers.length !== 11) {
      return res.status(400).json({
        message: "Jawaban tidak lengkap! Harus ada 11 jawaban.",
      });
    }

    // 🔁 Konversi ke skor (misal 6, 5, 3, 2)
    const converted = answers.map(mapAnswerToScoreCART);
    if (converted.includes(-1)) {
      return res
        .status(400)
        .json({ message: "Terdapat jawaban tidak valid." });
    }

    // 🔁 Bentuk jawaban 14 dengan aturan:
    // no 9 = no 1, no 13 = no 7, no 14 = no 4
    const extendedAnswers = [...converted];
    extendedAnswers.splice(8, 0, converted[0]);  // no 9 (index 8) = no 1
    extendedAnswers.splice(12, 0, converted[6]); // no 13 (index 12) = no 7
    extendedAnswers.push(converted[2]);          // no 14 (akhir) = no 4

    if (extendedAnswers.length !== 14) {
      return res
        .status(500)
        .json({ message: "Gagal membentuk 14 jawaban." });
    }

    // Cek apakah user sudah pernah mengisi sebelumnya
    const [existing] = await db.query(
      "SELECT id FROM questionnaire_answers_cart WHERE user_id = ?",
      [userId]
    );

    if (existing.length > 0) {
      // Update jika sudah ada
      await db.query(
        "UPDATE questionnaire_answers_cart SET answers = ? WHERE user_id = ?",
        [JSON.stringify(extendedAnswers), userId]
      );
    } else {
      // Insert jika belum ada
      await db.query(
        "INSERT INTO questionnaire_answers_cart (user_id, answers) VALUES (?, ?)",
        [userId, JSON.stringify(extendedAnswers)]
      );
    }

    res.status(200).json({
      message: "Jawaban 14 berhasil dikonversi dan disimpan (insert/update).",
      answers: extendedAnswers,
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};


