import bcrypt from "bcryptjs";
import db from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const forgotPassword = async (req, res) => {
    try {
        const { email, securityAnswer } = req.body;

        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Email tidak ditemukan" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(securityAnswer, user.security_answer);
        if (!isMatch) {
            return res.status(400).json({ message: "Jawaban tidak sesuai" });
        }

        res.status(200).json({ message: "Autentikasi berhasil" });
    } catch (error) {
        console.error("Error di backend:", error);
        res.status(500).json({ message: "Terjadi kesalahan di server" });
    }
};

export const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Email tidak ditemukan" });
        }

        const user = users[0];

        res.status(200).json({
            message: "Email valid",
            securityQuestion: user.security_question
        });
    } catch (error) {
        console.error("Error di backend:", error);
        res.status(500).json({ message: "Terjadi kesalahan di server" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        const [users] = await db.query("SELECT password FROM users WHERE email = ?", [email]);

        const { password: oldPassword } = users[0];

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Password baru dan konfirmasi password tidak cocok" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password harus minimal 8 karakter" });
        }

        const isSamePassword = await bcrypt.compare(newPassword, oldPassword);
        if (isSamePassword) {
            return res.status(400).json({ message: "Password baru tidak boleh sama dengan password sebelumnya" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

        res.status(200).json({ message: "Password berhasil diubah" });
    } catch (error) {
        console.error("Error di backend:", error);
        res.status(500).json({ message: "Terjadi kesalahan di server"});
    }
};