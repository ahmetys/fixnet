import api from "./api";

export const getAllOperations = async () => {
  const response = await api.get("/operations");
  return response.data;
};

export const getOperationById = async (id) => {
  const response = await api.get(`/operations/${id}`);
  return response.data;
};

export const createOperation = async (operationData) => {
  const response = await api.post("/operations", operationData);
  return response.data;
};

export const updateOperation = async (id, operationData) => {
  const response = await api.put(`/operations/${id}`, operationData);
  return response.data;
};

export const deleteOperation = async (id) => {
  await api.delete(`/operations/${id}`);
};
