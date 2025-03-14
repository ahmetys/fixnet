import pool from "../config/database.js";

export const getAllCustomers = async () => {
  const [rows] = await pool.query("SELECT * FROM customers");
  return rows;
};

export const getCustomerById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM customers WHERE customer_id = ?", [id]);
  return rows[0];
};

export const createCustomer = async (customer) => {
  const [rows] = await pool.query("INSERT INTO customers SET ?", [customer]);
  return rows.insertId;
};

export const updateCustomer = async (id, customer) => {
  const [rows] = await pool.query("UPDATE customers SET ? WHERE customer_id = ?", [customer, id]);
  return rows[0];
};

export const deleteCustomer = async (id) => {
  const [rows] = await pool.query("DELETE FROM customers WHERE customer_id = ?", [id]);
  return rows[0];
};

export const searchCustomer = async (searchTerm) => {
  const [customers] = await pool.query("SELECT * FROM customers WHERE customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ? LIMIT 10", [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
  return customers;
};
