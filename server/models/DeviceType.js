import pool from "../config/database.js";

export const getAllDeviceTypes = async () => {
  const [result] = await pool.query("SELECT * FROM device_types");
  return result;
};

export const getDeviceTypeById = async (id) => {
  const [result] = await pool.query("SELECT * FROM device_types WHERE device_type_id = ?", [id]);
  return result[0];
};

export const createDeviceType = async (deviceType) => {
  console.log(deviceType);
  const [result] = await pool.query("INSERT INTO device_types SET ?", [deviceType]);
  return result.insertId;
};

export const updateDeviceType = async (id, deviceType) => {
  const [result] = await pool.query("UPDATE device_types SET ? WHERE device_type_id = ?", [deviceType, id]);
  return result.affectedRows;
};

export const deleteDeviceType = async (id) => {
  const [result] = await pool.query("DELETE FROM device_types WHERE device_type_id = ?", [id]);
  return result.affectedRows;
};

export const getAllDeviceTypesByBrand = async (brandId) => {
  const [result] = await pool.query("SELECT * FROM device_types WHERE device_brand_id = ?", [brandId]);
  return result;
};
