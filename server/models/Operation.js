import pool from "../config/database.js";

export const getAllOperations = async () => {
  const [result] = await pool.query("SELECT * FROM operations");
  return result;
};

export const getOperationById = async (id) => {
  const [result] = await pool.query("SELECT * FROM operations WHERE operation_id = ?", [id]);
  return result[0];
};

export const createOperation = async (operationName) => {
  try {
    const [result] = await pool.query("INSERT INTO operations SET operation_name = ?", [operationName]);

    if (result.insertId) {
      return {
        operation_id: result.insertId,
        operation_name: operationName,
      };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const updateOperation = async (id, operation) => {
  const [result] = await pool.query("UPDATE operations SET ? WHERE operation_id = ?", [operation, id]);
  return result.affectedRows;
};

export const deleteOperation = async (id) => {
  const [result] = await pool.query("DELETE FROM operations WHERE operation_id = ?", [id]);
  return result.affectedRows;
};

export const findByName = async (operationName) => {
  try {
    const [rows] = await pool.query("SELECT * FROM operations WHERE operation_name = ?", [operationName]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};
