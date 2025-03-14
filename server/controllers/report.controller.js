import * as CustomerReport from "../models/reports/CustomerReport.js";
import * as DeviceReport from "../models/reports/DeviceReport.js";
import * as TicketReport from "../models/reports/TicketReport.js";
import * as OperationReport from "../models/reports/OperationReport.js";
import * as FinancialReport from "../models/reports/FinancialReport.js";
// Customer statistics
export const getCustomerStats = async (req, res) => {
  try {
    const stats = await CustomerReport.getCustomerStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getCustomerStats controller:", error);
    res.status(500).json({ message: "Error fetching customer statistics", error: error.message });
  }
};

// Device statistics
export const getDeviceStats = async (req, res) => {
  try {
    const stats = await DeviceReport.getDeviceStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getDeviceStats controller:", error);
    res.status(500).json({ message: "Error fetching device statistics", error: error.message });
  }
};

// Ticket statistics
export const getTicketStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const stats = await TicketReport.getTicketStats(timeRange);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getTicketStats controller:", error);
    res.status(500).json({ message: "Error fetching ticket statistics", error: error.message });
  }
};

// Operation statistics
export const getOperationStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const stats = await OperationReport.getOperationStats(timeRange);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getOperationStats controller:", error);
    res.status(500).json({ message: "Error fetching operation statistics", error: error.message });
  }
};

// Financial statistics
export const getFinancialStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const stats = await FinancialReport.getFinancialStats(timeRange);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getFinancialStats controller:", error);
    res.status(500).json({ message: "Error fetching financial statistics", error: error.message });
  }
};
