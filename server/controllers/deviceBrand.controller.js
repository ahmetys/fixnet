import * as DeviceBrand from "../models/DeviceBrand.js";

export const getAllDeviceBrands = async (req, res) => {
  try {
    const deviceBrands = await DeviceBrand.getAllDeviceBrands();

    res.status(200).json(deviceBrands);
  } catch (error) {
    res.status(500).json({ message: "Error fetching device brands", error: error.message });
  }
};

export const getDeviceBrandById = async (req, res) => {
  try {
    const deviceBrand = await DeviceBrand.getDeviceBrandById(req.params.id);

    if (!deviceBrand) {
      return res.status(404).json({ message: "Device brand not found" });
    }

    res.status(200).json(deviceBrand);
  } catch (error) {
    res.status(500).json({ message: "Error fetching device brand", error: error.message });
  }
};

export const createDeviceBrand = async (req, res) => {
  try {
    const deviceBrand = await DeviceBrand.createDeviceBrand(req.body);

    res.status(201).json(deviceBrand);
  } catch (error) {
    res.status(500).json({ message: "Error creating device brand", error: error.message });
  }
};

export const updateDeviceBrand = async (req, res) => {
  try {
    const deviceBrand = await DeviceBrand.updateDeviceBrand(req.params.id, req.body);

    res.status(200).json(deviceBrand);
  } catch (error) {
    res.status(500).json({ message: "Error updating device brand", error: error.message });
  }
};

export const deleteDeviceBrand = async (req, res) => {
  try {
    await DeviceBrand.deleteDeviceBrand(req.params.id);

    res.status(204).json({ message: "Device brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting device brand", error: error.message });
  }
};
