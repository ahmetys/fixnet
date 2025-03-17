import api from "./api";

export const getSettings = async () => {
  try {
    const { data } = await api.get("/settings");
    return data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

export const updateSettings = async (settings) => {
  try {
    const { data } = await api.put("/settings", settings);
    return data;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};
