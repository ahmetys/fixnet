import pool from "../config/database.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const findByEmail = async (email) => {
  try {
    const [users] = await pool.query("SELECT user_id, user_name, user_password, user_email, user_role FROM users WHERE user_email = ?", [email]);
    return users[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

export const getCurrentUser = async (userId) => {
  try {
    const [user] = await pool.query("SELECT user_id, user_name,user_email, user_role FROM users WHERE user_id = ?", [userId]);

    if (!user) {
      return null;
    }

    return user[0];
  } catch (error) {
    throw error;
  }
};

export const createSession = async (userId, token) => {
  try {
    const [result] = await pool.query("INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))", [userId, token]);
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

export const checkSession = async (userId, token) => {
  try {
    const [result] = await pool.query("SELECT * FROM user_sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()", [userId, token]);
    return result[0];
  } catch (error) {
    throw error;
  }
};

export const deleteSession = async (userId) => {
  try {
    const [result] = await pool.query("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
};

export const createPasswordResetToken = async (userId, email) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 saat geçerli

  try {
    await pool.query("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?) " + "ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)", [userId, resetToken, resetTokenExpiry]);

    return resetToken;
  } catch (error) {
    console.error("Token oluşturma hatası:", error);
    throw new Error("Şifre sıfırlama token'ı oluşturulurken bir hata oluştu");
  }
};

export const verifyResetToken = async (token) => {
  try {
    const [results] = await pool.query("SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()", [token]);

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error("Token doğrulama hatası:", error);
    throw new Error("Token doğrulanırken bir hata oluştu");
  }
};

export const resetUserPassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await pool.query("UPDATE users SET user_password = ? WHERE user_id = ?", [hashedPassword, userId]);

    return true;
  } catch (error) {
    console.error("Şifre güncelleme hatası:", error);
    throw new Error("Şifre güncellenirken bir hata oluştu");
  }
};

export const deleteResetToken = async (token) => {
  try {
    await pool.query("DELETE FROM password_reset_tokens WHERE token = ?", [token]);
    return true;
  } catch (error) {
    console.error("Token silme hatası:", error);
    throw new Error("Token silinirken bir hata oluştu");
  }
};
