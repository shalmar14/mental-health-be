import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import jwt from 'jsonwebtoken';


export const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

        if (!name || !email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ message: "Semua field wajib diisi!" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password harus memiliki minimal 8 karakter." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Password tidak cocok!" });
        }

        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email sudah terdaftar!" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedSecurityAnswer = await bcrypt.hash(securityAnswer, 10);

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

export const login = async (req, res) => {
  try {
      const { email, password, rememberMe } = req.body;

      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (users.length === 0) {
          return res.status(401).json({ message: "There's No Account With This Email" });
      }

      const user = users[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).json({ message: "The Password Is Incorrect" });
      }

      const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: rememberMe ? "3d" : "1h" } 
      );

      res.json({ 
        message: "Login Successful!", 
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