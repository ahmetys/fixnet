import pool from "../config/database.js";

export const getSettings = async () => {
  const [result] = await pool.query("SELECT * FROM store");
  return result[0];
};

export const updateSettings = async (settings) => {
  console.log("updateSettings");
  console.log(settings);
  const [result] = await pool.query("UPDATE store SET ? WHERE store_id = ?", [settings, settings.store_id]);
  return result[0];
};
