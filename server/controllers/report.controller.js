import * as Report from "../models/Report.js";

export const getCustomerStats = async (req, res) => {
  try {
    const stats = await Report.getCustomerStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customer statistics", error: error.message });
  }
};

// Device statistics
export const getDeviceStats = async (req, res) => {
  try {
    const stats = await Report.getDeviceStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching device statistics", error: error.message });
  }
};

// Ticket statistics
export const getTicketStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const stats = await Report.getTicketStats(timeRange);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ticket statistics", error: error.message });
  }
};

// Operation statistics
export const getOperationStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const stats = await Report.getOperationStats(timeRange);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching operation statistics", error: error.message });
  }
};

// Financial statistics
export const getFinancialStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const stats = await Report.getFinancialStats(timeRange);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching financial statistics", error: error.message });
  }
};
