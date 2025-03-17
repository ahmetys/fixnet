import * as TicketLog from "../models/TicketLog.js";

export const createTicketLog = async (req, res) => {
  try {
    const result = await TicketLog.createTicketLog(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        log_id: result.log_id,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create ticket log",
    });
  }
};

export const getTicketLogs = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const logs = await TicketLog.getTicketLogs(ticketId);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket logs",
    });
  }
};
