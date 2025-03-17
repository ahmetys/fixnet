import api from "./api";

export const getAllOperations = async () => {
  try {
    const response = await api.get("/operations");
    return response.data;
  } catch (error) {
    console.error("Error fetching operations:", error);
    throw error;
  }
};

export const getOperationById = async (id) => {
  try {
    const response = await api.get(`/operations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching operation by ID:", error);
    throw error;
  }
};

export const createOperation = async (operationData) => {
  try {
    const response = await api.post("/operations", operationData);
    return response.data;
  } catch (error) {
    console.error("Error creating operation:", error);
    throw error;
  }
};

export const updateOperation = async (id, operationData) => {
  try {
    const response = await api.put(`/operations/${id}`, operationData);
    return response.data;
  } catch (error) {
    console.error("Error updating operation:", error);
    throw error;
  }
};

export const deleteOperation = async (id) => {
  try {
    await api.delete(`/operations/${id}`);
  } catch (error) {
    console.error("Error deleting operation:", error);
    throw error;
  }
};
