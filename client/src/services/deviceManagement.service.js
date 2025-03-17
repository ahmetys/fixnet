import api from "./api";

// Get all device brands
export const getAllDeviceBrands = async () => {
  try {
    const response = await api.get("/deviceBrands");
    return response.data;
  } catch (error) {
    console.error("Error fetching device brands:", error);
    throw error;
  }
};

// Get device brand by ID
export const getDeviceBrandById = async (brandId) => {
  try {
    const response = await api.get(`/deviceBrands/${brandId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching device brand with ID ${brandId}:`, error);
    throw error;
  }
};

// Create a new device brand
export const createDeviceBrand = async (deviceBrandData) => {
  try {
    const response = await api.post("/deviceBrands", deviceBrandData);
    return response.data;
  } catch (error) {
    console.error("Error creating device brand:", error);
    throw error;
  }
};

// Update a device brand
export const updateDeviceBrand = async (brandId, deviceBrandData) => {
  try {
    const response = await api.put(`/deviceBrands/${brandId}`, deviceBrandData);
    return response.data;
  } catch (error) {
    console.error(`Error updating device brand with ID ${brandId}:`, error);
    throw error;
  }
};

// Delete a device brand
export const deleteDeviceBrand = async (brandId) => {
  try {
    const response = await api.delete(`/deviceBrands/${brandId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting device brand with ID ${brandId}:`, error);
    throw error;
  }
};

// Search device brands
export const searchDeviceBrands = async (searchTerm) => {
  try {
    const response = await api.get(`/deviceBrands/search?q=${searchTerm}`);
    return response.data;
  } catch (error) {
    console.error("Error searching device brands:", error);
    throw error;
  }
};

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
