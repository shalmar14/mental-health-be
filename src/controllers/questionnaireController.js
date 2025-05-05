import db from "../config/db.js";
import { mapAnswerToScorePHQ, mapAnswerToScoreCART } from "../utils/mapper.js"

export const submitAnswersPHQ = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    if (!Array.isArray(answers) || answers.length !== 23) {
      return res.status(400).json({
        message: "Jawaban tidak lengkap! Harus ada 23 jawaban."
      });
    }

    const phq9Answers = [...answers.slice(14, 23)];

    const numericAnswers = phq9Answers.map(mapAnswerToScorePHQ);

    if (numericAnswers.includes(-1)) {
      return res.status(400).json({ message: "Terdapat jawaban tidak valid." });
    }

    const [existing] = await db.query(
      "SELECT id FROM questionnaire_answers_phq WHERE user_id = ?",
      [userId]
    );
    
    if (existing.length > 0) {
      await db.query(
        "UPDATE questionnaire_answers_phq SET answers = ? WHERE user_id = ?",
        [JSON.stringify(numericAnswers), userId]
      );
      return res.status(200).json({ message: "Jawaban berhasil diperbarui.", action: "update" });
    }
    
    await db.query(
      "INSERT INTO questionnaire_answers_phq (user_id, answers) VALUES (?, ?)",
      [userId, JSON.stringify(numericAnswers)]
    );
    
    res.status(200).json({ message: "Jawaban berhasil disimpan.", action: "insert" });
  } catch (error) {
    console.error("Error saat menyimpan kuisioner:", error.message);
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

    if (!Array.isArray(answers) || answers.length !== 23) {
      return res.status(400).json({
        message: "Jawaban tidak lengkap! Harus ada 23 jawaban.",
      });
    }

    const selectedAnswers = [answers[0], ...answers.slice(2, 14)];

    if (selectedAnswers.length !== 13) {
      return res.status(500).json({ message: "Gagal membentuk 13 jawaban." });
    }

    const mappedAnswers = mapAnswerToScoreCART(selectedAnswers);

    const [existing] = await db.query(
      "SELECT id FROM questionnaire_answers_cart WHERE user_id = ?",
      [userId]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE questionnaire_answers_cart SET answers = ? WHERE user_id = ?",
        [JSON.stringify(mappedAnswers), userId]
      );
    } else {
      await db.query(
        "INSERT INTO questionnaire_answers_cart (user_id, answers) VALUES (?, ?)",
        [userId, JSON.stringify(mappedAnswers)]
      );
    }

    res.status(200).json({
      message: "Jawaban berhasil disimpan dalam bentuk angka (insert/update).",
      originalAnswers: selectedAnswers,
      mappedAnswers: mappedAnswers,
    });
    
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

export const addAge = async (req, res) => {
  try {
    const { age } = req.body;
    const userId = req.user?.id;

    await db.query(
      "UPDATE users SET age = ? WHERE id = ?",
      [age, userId]
    );

    res.status(200).json({
      message: "Kolom Umur Berhasil Ditambahkan.",
    });

  } catch (err) {
    console.log("Error:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
  
}

export const addGender = async (req, res) => {
  try {
    const { gender } = req.body;
    const userId = req.user?.id;

    await db.query(
      "UPDATE users SET gender = ? WHERE id = ?",
      [gender, userId]
    );

    res.status(200).json({
      message: "Kolom Jenis Kelamin Berhasil Ditambahkan.",
    });

  } catch (err) {
    console.log("Error:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
  
}
