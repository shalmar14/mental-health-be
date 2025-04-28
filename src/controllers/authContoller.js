import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import jwt from 'jsonwebtoken';


// Controller untuk registrasi
export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

        // Mengecek apakah semua field sudah diisi
        if (!name || !email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ message: "Semua field wajib diisi!" });
        }

        // Validasi password minimal 8 karakter
        if (password.length < 8) {
            return res.status(400).json({ message: "Password harus memiliki minimal 8 karakter." });
        }

        // Mengecek apakah password sudah sesuai
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Password tidak cocok!" });
        }

        // Cek apakah email sudah digunakan
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar!" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedSecurityAnswer = await bcrypt.hash(securityAnswer, 10);

        // Simpan user baru ke database
        await db.query("INSERT INTO users (name, email, password, security_question, security_answer) VALUES (?, ?, ?, ?, ?)", [
            name,
            email,
            hashedPassword,
            securityQuestion,
            hashedSecurityAnswer
          ]);
          

        res.status(201).json({ message: "Registrasi berhasil!" });
    } catch (error) {
        console.error("Error di backend:", error);
        res.status(500).json({ message: "Terjadi kesalahan di server." });
    }
};


// Login
export const login = async (req, res) => {
  try {
      const { email, password, rememberMe } = req.body;

      // Cek user di database
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (users.length === 0) {
          return res.status(401).json({ message: "Email belum terdaftar" });
      }

      const user = users[0];

      // Cek password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).json({ message: "Password tidak cocok" });
      }

      // Buat token JWT
      const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: rememberMe ? "3d" : "1h" } // Remember Me = 3 hari, jika tidak = 1 jam
      );

      // Kirim token ke frontend
      res.json({ 
        message: "Login berhasil!", 
        token,
        user: {
            id: user.id,
            name: user.name, 
            email: user.email
        }
    });

  } catch (error) {
      console.error("Error saat login:", error);
      res.status(500).json({ message: "Terjadi kesalahan di server." });
  }
};