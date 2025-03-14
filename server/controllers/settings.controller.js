import * as Settings from "../models/Settings.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const updatedSettings = await Settings.updateSettings(req.body);
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
