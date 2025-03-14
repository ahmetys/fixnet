import * as DeviceModel from "../models/DeviceModel.js";

export const getAllDeviceModels = async (req, res) => {
  const deviceModels = await DeviceModel.getAllDeviceModels();
  res.json(deviceModels);
};

export const getDeviceModelById = async (req, res) => {
  const deviceModel = await DeviceModel.getDeviceModelById(req.params.id);
  res.json(deviceModel);
};

export const createDeviceModel = async (req, res) => {
  const deviceModel = await DeviceModel.createDeviceModel(req.body);
  res.json(deviceModel);
};

export const updateDeviceModel = async (req, res) => {
  const deviceModel = await DeviceModel.updateDeviceModel(req.params.id, req.body);
  res.json(deviceModel);
};

export const deleteDeviceModel = async (req, res) => {
  const deviceModel = await DeviceModel.deleteDeviceModel(req.params.id);
  res.json(deviceModel);
};

export const getAllDeviceModelsByType = async (req, res) => {
  const deviceModels = await DeviceModel.getAllDeviceModelsByType(req.params.typeId);
  res.json(deviceModels);
};
