import api from "./api";

// Customer statistics
export const getCustomerStats = async () => {
  try {
    const response = await api.get("/reports/customers");
    return response.data;
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    throw error;
  }
};

// Device statistics
export const getDeviceStats = async () => {
  try {
    const response = await api.get("/reports/devices");
    return response.data;
  } catch (error) {
    console.error("Error fetching device stats:", error);
    throw error;
  }
};

// Ticket statistics
export const getTicketStats = async (timeRange = "month") => {
  try {
    const response = await api.get(`/reports/tickets?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    throw error;
  }
};

// Operation statistics
export const getOperationStats = async (timeRange = "month") => {
  try {
    const response = await api.get(`/reports/operations?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching operation stats:", error);
    throw error;
  }
};

// Financial statistics
export const getFinancialStats = async (timeRange = "month") => {
  try {
    const response = await api.get(`/reports/financials?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    throw error;
  }
};
