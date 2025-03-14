import api from "./api";

// Get all device types
export const getAllDeviceTypes = async () => {
  try {
    const response = await api.get("/deviceTypes");
    return response.data;
  } catch (error) {
    console.error("Error fetching device types:", error);
    throw error;
  }
};

// Get device type by ID
export const getDeviceTypeById = async (typeId) => {
  try {
    const response = await api.get(`/deviceTypes/${typeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching device type with ID ${typeId}:`, error);
    throw error;
  }
};

// Create a new device type
export const createDeviceType = async (deviceTypeData) => {
  try {
    const response = await api.post("/deviceTypes", deviceTypeData);
    return response.data;
  } catch (error) {
    console.error("Error creating device type:", error);
    throw error;
  }
};

// Update a device type
export const updateDeviceType = async (typeId, deviceTypeData) => {
  try {
    const response = await api.put(`/deviceTypes/${typeId}`, deviceTypeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating device type with ID ${typeId}:`, error);
    throw error;
  }
};

// Delete a device type
export const deleteDeviceType = async (typeId) => {
  try {
    const response = await api.delete(`/deviceTypes/${typeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting device type with ID ${typeId}:`, error);
    throw error;
  }
};

// Get device types by brand ID
export const getAllDeviceTypesByBrand = async (brandId) => {
  try {
    const response = await api.get(`/deviceTypes/brand/${brandId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching device types for brand with ID ${brandId}:`, error);

    // Geçici mock veri - API endpoint'i henüz yoksa
    console.warn("Using mock data for device types by brand");
    return [];
  }
};

// Search device types
export const searchDeviceTypes = async (searchTerm) => {
  try {
    const response = await api.get(`/deviceTypes/search?q=${searchTerm}`);
    return response.data;
  } catch (error) {
    console.error("Error searching device types:", error);
    throw error;
  }
};
