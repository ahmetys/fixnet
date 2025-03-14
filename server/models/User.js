import pool from "../config/database.js";

export const findByEmail = async (email) => {
  try {
    const [users] = await pool.query("SELECT user_id, user_name, user_password, user_email, user_role FROM users WHERE user_email = ?", [email]);
    console.log("Database query result:", users); // Debug için
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
  console.log("userId", userId);
  try {
    const [result] = await pool.query("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
};
