import api from "./api";

export const getAllTickets = async () => {
  const response = await api.get("/tickets");
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async (ticket) => {
  const response = await api.post("/tickets", ticket);
  return response.data;
};

export const updateTicket = async (id, ticket) => {
  const response = await api.put(`/tickets/${id}`, ticket);
  return response.data;
};

export const deleteTicket = async (id) => {
  const response = await api.delete(`/tickets/${id}`);
  return response.data;
};

export const searchTicket = async (searchTerm) => {
  const response = await api.get(`/tickets/search?q=${searchTerm}`);
  return response.data;
};

// Get tickets by customer ID
export const getTicketsByCustomerId = async (customerId) => {
  try {
    const response = await api.get(`/tickets/customer/${customerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tickets for customer with ID ${customerId}:`, error);
    throw error;
  }
};

export const updateOperationPrice = async (operationId, price) => {
  console.log("operationId", operationId);
  console.log("price", price);
  try {
    const response = await api.put(`/tickets/operations/${operationId}`, {
      ticket_operation_price: price,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating operation price:", error);
    throw error;
  }
};

// Yeni operasyon ekleme
export const addTicketOperation = async (ticketId, operationId, price) => {
  console.log("ticketId", ticketId);
  console.log("operationId", operationId);
  console.log("price", price);
  try {
    const response = await api.post(`/tickets/${ticketId}/operations`, {
      operation_id: operationId,
      ticket_operation_price: price,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding ticket operation:", error);
    throw error;
  }
};

// Operasyon silme
export const deleteTicketOperation = async (operationId) => {
  try {
    const response = await api.delete(`/tickets/operations/${operationId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting ticket operation:", error);
    throw error;
  }
};

// Finansal rapor almak için
export const getFinancialReport = async (params) => {
  try {
    const response = await api.get("/reports/financial", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching financial report:", error);
    throw error;
  }
};

// Durum raporu almak için
export const getStatusReport = async (params) => {
  try {
    const response = await api.get("/reports/status", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching status report:", error);
    throw error;
  }
};

// Operasyon raporu almak için
export const getOperationsReport = async (params) => {
  try {
    const response = await api.get("/reports/operations", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching operations report:", error);
    throw error;
  }
};

// Cihaz raporu almak için
export const getDevicesReport = async (params) => {
  try {
    const response = await api.get("/reports/devices", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching devices report:", error);
    throw error;
  }
};

export const markTicketDelivered = async (id) => {
  const response = await api.put(`/tickets/${id}/deliver`);
  return response.data;
};
