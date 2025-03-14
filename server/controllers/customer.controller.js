import * as Customer from "../models/Customer.js";

export const getAllCustomers = async (req, res) => {
  const customers = await Customer.getAllCustomers();
  res.json(customers);
};

export const getCustomerById = async (req, res) => {
  const customer = await Customer.getCustomerById(req.params.id);
  res.json(customer);
};

export const createCustomer = async (req, res) => {
  const customer = await Customer.createCustomer(req.body);
  res.json(customer);
};

export const updateCustomer = async (req, res) => {
  const customer = await Customer.updateCustomer(req.params.id, req.body);
  res.json(customer);
};

export const deleteCustomer = async (req, res) => {
  const customer = await Customer.deleteCustomer(req.params.id);
  res.json(customer);
};

export const searchCustomer = async (req, res) => {
  const customers = await Customer.searchCustomer(req.body.searchTerm);
  res.json(customers);
};
