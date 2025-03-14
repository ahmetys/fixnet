import pool from "../config/database.js";

export const getAllOperations = async () => {
  const [result] = await pool.query("SELECT * FROM operations");
  return result;
};

export const getOperationById = async (id) => {
  const [result] = await pool.query("SELECT * FROM operations WHERE operation_id = ?", [id]);
  return result[0];
};

export const createOperation = async (operation) => {
  console.log(operation);
  const [result] = await pool.query("INSERT INTO operations SET ?", [operation]);
  return result.insertId;
};

export const updateOperation = async (id, operation) => {
  const [result] = await pool.query("UPDATE operations SET ? WHERE operation_id = ?", [operation, id]);
  return result.affectedRows;
};

export const deleteOperation = async (id) => {
  const [result] = await pool.query("DELETE FROM operations WHERE operation_id = ?", [id]);
  return result.affectedRows;
};
