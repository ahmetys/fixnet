import * as Operation from "../models/Operation.js";

export const getAllOperations = async (req, res) => {
  const operations = await Operation.getAllOperations();
  res.json(operations); //operations listesi döndürür
};

export const getOperationById = async (req, res) => {
  const operation = await Operation.getOperationById(req.params.id);
  res.json(operation);
};

export const createOperation = async (req, res) => {
  const operation = await Operation.createOperation(req.body);
  res.json(operation);
};

export const updateOperation = async (req, res) => {
  const operation = await Operation.updateOperation(req.params.id, req.body);
  res.json(operation);
};

export const deleteOperation = async (req, res) => {
  const operation = await Operation.deleteOperation(req.params.id);
  res.json(operation);
};
