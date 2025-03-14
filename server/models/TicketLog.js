import pool from "../config/database.js";

export const createTicketLog = async (logData) => {
  console.log(logData);
  try {
    const { ticket_id, user_id, log_type, log_description, log_details } = logData;
    const [result] = await pool.query(
      `INSERT INTO ticket_logs 
       (ticket_id, user_id, log_type, log_description, log_details) 
       VALUES (?, ?, ?, ?, ?)`,
      [ticket_id, user_id || null, log_type, log_description, JSON.stringify(log_details || {})]
    );

    return {
      success: true,
      log_id: result.insertId,
    };
  } catch (error) {
    console.error("Error creating ticket log:", error);
    return {
      success: false,
      message: "Failed to create ticket log",
    };
  }
};

export const getTicketLogs = async (ticketId) => {
  try {
    const [rows] = await pool.query(
      `SELECT tl.*, u.user_name 
       FROM ticket_logs tl
       LEFT JOIN users u ON tl.user_id = u.user_id
       WHERE tl.ticket_id = ?
       ORDER BY tl.created_at DESC`,
      [ticketId]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching ticket logs:", error);
    throw error;
  }
};
