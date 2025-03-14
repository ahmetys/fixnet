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
