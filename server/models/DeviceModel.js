import pool from "../config/database.js";

export const getAllDeviceModels = async () => {
  const [rows] = await pool.query("SELECT * FROM device_models");
  return rows;
};

export const getDeviceModelById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM device_models WHERE device_model_id = ?", [id]);
  return rows[0];
};

export const createDeviceModel = async (deviceModel) => {
  const [result] = await pool.query("INSERT INTO device_models (device_model_name, device_type_id, device_brand_id) VALUES (?, ?, ?)", [deviceModel.device_model_name, deviceModel.device_type_id, deviceModel.device_brand_id]);
  return result.insertId;
};

export const updateDeviceModel = async (id, deviceModel) => {
  const [result] = await pool.query("UPDATE device_models SET device_model_name = ? WHERE device_model_id = ?", [deviceModel.device_model_name, id]);
  return result.affectedRows;
};

export const deleteDeviceModel = async (id) => {
  const [result] = await pool.query("DELETE FROM device_models WHERE device_model_id = ?", [id]);
  return result.affectedRows;
};

export const getAllDeviceModelsByType = async (typeId) => {
  const [rows] = await pool.query("SELECT * FROM device_models WHERE device_type_id = ?", [typeId]);
  return rows;
};
