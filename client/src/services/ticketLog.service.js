import api from "./api";

export const createTicketLog = async (logData) => {
  try {
    const response = await api.post("/ticketLogs", logData);
    return response.data;
  } catch (error) {
    console.error("Error creating ticket log:", error);
    throw error;
  }
};

export const getTicketLogs = async (ticketId) => {
  try {
    const response = await api.get(`/ticketLogs/ticket/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ticket logs:", error);
    throw error;
  }
};
