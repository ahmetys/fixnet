import * as Operation from "../models/Operation.js";

export const getAllOperations = async (req, res) => {
  const operations = await Operation.getAllOperations();
  res.json(operations); //operations listesi döndürür
};

export const getOperationById = async (req, res) => {
  const operation = await Operation.getOperationById(req.params.id);
  res.json(operation);
};

export const createOperation = async (req, res, next) => {
  try {
    const { operation_name } = req.body;

    if (!operation_name) {
      return res.status(400).json({
        success: false,
        message: "Operasyon adı gereklidir",
      });
    }

    // Operasyon zaten var mı kontrol et
    const existingOperation = await Operation.findByName(operation_name);
    if (existingOperation) {
      return res.status(409).json({
        success: false,
        message: `'${operation_name}' isimli servis işlemi zaten mevcut`,
      });
    }

    const result = await Operation.createOperation(operation_name);

    res.status(201).json({
      success: true,
      message: "Operasyon başarıyla oluşturuldu",
      operation: result,
    });
  } catch (error) {
    // Hata yakalama middleware'ine ilet
    next(error);
  }
};

export const updateOperation = async (req, res) => {
  const operation = await Operation.updateOperation(req.params.id, req.body);
  res.json(operation);
};

export const deleteOperation = async (req, res) => {
  const operation = await Operation.deleteOperation(req.params.id);
  res.json(operation);
};
