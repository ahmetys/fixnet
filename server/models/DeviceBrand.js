import pool from "../config/database.js";

export const getAllDeviceBrands = async () => {
  const [rows] = await pool.query("SELECT * FROM device_brands");
  return rows;
};

export const getDeviceBrandById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM device_brands WHERE device_brand_id = ?", [id]);
  return rows[0];
};

export const createDeviceBrand = async (deviceBrand) => {
  console.log(deviceBrand);
  const [result] = await pool.query("INSERT INTO device_brands (device_brand_name) VALUES (?)", [deviceBrand.device_brand_name]);
  return result.insertId;
};

export const updateDeviceBrand = async (id, deviceBrand) => {
  const [result] = await pool.query("UPDATE device_brands SET device_brand_name = ? WHERE device_brand_id = ?", [deviceBrand.device_brand_name, id]);
  return result.affectedRows;
};

export const deleteDeviceBrand = async (id) => {
  const [result] = await pool.query("DELETE FROM device_brands WHERE device_brand_id = ?", [id]);
  return result.affectedRows;
};
