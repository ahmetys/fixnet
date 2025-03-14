import * as DeviceType from "../models/DeviceType.js";

export const getAllDeviceTypes = async (req, res) => {
  const deviceTypes = await DeviceType.getAllDeviceTypes();
  res.json(deviceTypes);
};

export const getDeviceTypeById = async (req, res) => {
  const deviceType = await DeviceType.getDeviceTypeById(req.params.id);
  res.json(deviceType);
};

export const createDeviceType = async (req, res) => {
  const deviceType = await DeviceType.createDeviceType(req.body);
  res.json(deviceType);
};

export const updateDeviceType = async (req, res) => {
  const deviceType = await DeviceType.updateDeviceType(req.params.id, req.body);
  res.json(deviceType);
};

export const deleteDeviceType = async (req, res) => {
  const deviceType = await DeviceType.deleteDeviceType(req.params.id);
  res.json(deviceType);
};

export const getAllDeviceTypesByBrand = async (req, res) => {
  const deviceTypes = await DeviceType.getAllDeviceTypesByBrand(req.params.brandId);
  res.json(deviceTypes);
};
