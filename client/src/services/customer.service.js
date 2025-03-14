import api from "./api";

// Get all customers
export const getAllCustomers = async () => {
  try {
    const response = await api.get("/customers");
    return response.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

// Get customer by ID
export const getCustomerById = async (customerId) => {
  try {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer with ID ${customerId}:`, error);
    throw error;
  }
};

// Create a new customer
export const createCustomer = async (customerData) => {
  try {
    const response = await api.post("/customers", customerData);
    return response.data;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await api.put(`/customers/${customerId}`, customerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating customer with ID ${customerId}:`, error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (customerId) => {
  try {
    const response = await api.delete(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer with ID ${customerId}:`, error);
    throw error;
  }
};

// Search customers
export const searchCustomer = async (searchTerm) => {
  const response = await api.post("/customers/search", { searchTerm });
  return response.data;
};

// Müşteri raporu almak için
export const getCustomersReport = async (params) => {
  try {
    const response = await api.get("/reports/customers", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching customers report:", error);
    throw error; // Mock veriler yerine hatayı fırlat
  }
};
