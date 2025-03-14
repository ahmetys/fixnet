import api from "./api";

// Get all device models
export const getAllDeviceModels = async () => {
  try {
    const response = await api.get("/deviceModels");
    return response.data;
  } catch (error) {
    console.error("Error fetching device models:", error);
    throw error;
  }
};

// Get device model by ID
export const getDeviceModelById = async (modelId) => {
  try {
    const response = await api.get(`/deviceModels/${modelId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching device model with ID ${modelId}:`, error);
    throw error;
  }
};

// Create a new device model
export const createDeviceModel = async (deviceModelData) => {
  try {
    const response = await api.post("/deviceModels", deviceModelData);
    return response.data;
  } catch (error) {
    console.error("Error creating device model:", error);
    throw error;
  }
};

// Update a device model
export const updateDeviceModel = async (modelId, deviceModelData) => {
  try {
    const response = await api.put(`/deviceModels/${modelId}`, deviceModelData);
    return response.data;
  } catch (error) {
    console.error(`Error updating device model with ID ${modelId}:`, error);
    throw error;
  }
};

// Delete a device model
export const deleteDeviceModel = async (modelId) => {
  try {
    const response = await api.delete(`/deviceModels/${modelId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting device model with ID ${modelId}:`, error);
    throw error;
  }
};

// Get device models by device type ID
export const getAllDeviceModelsByType = async (typeId) => {
  try {
    const response = await api.get(`/deviceModels/type/${typeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching device models for type with ID ${typeId}:`, error);

    // Geçici mock veri - API endpoint'i henüz yoksa
    console.warn("Using mock data for device models by type");
    return [];
  }
};

// Get device models by brand ID
export const getAllDeviceModelsByBrand = async (brandId) => {
  try {
    const response = await api.get(`/deviceModels/brand/${brandId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching device models for brand with ID ${brandId}:`, error);

    // Geçici mock veri - API endpoint'i henüz yoksa
    console.warn("Using mock data for device models by brand");
    return [];
  }
};

// Search device models
export const searchDeviceModels = async (searchTerm) => {
  try {
    const response = await api.get(`/deviceModels/search?q=${searchTerm}`);
    return response.data;
  } catch (error) {
    console.error("Error searching device models:", error);
    throw error;
  }
};
