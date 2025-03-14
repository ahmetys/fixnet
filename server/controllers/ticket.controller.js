import * as Ticket from "../models/Ticket.js";

export const createTicket = async (req, res) => {
  const ticket = await Ticket.createTicket(req.body);
  res.status(201).json(ticket);
};

export const getTicketById = async (req, res) => {
  const { id } = req.params;
  const ticket = await Ticket.getTicketById(id);
  res.json(ticket);
};

export const updateTicket = async (req, res) => {
  const { id } = req.params;
  const ticket = await Ticket.updateTicket(id, req.body);
  res.json(ticket);
};

export const deleteTicket = async (req, res) => {
  const { id } = req.params;
  await Ticket.deleteTicket(id);
  res.json({ message: "Ticket deleted" });
};

export const searchTicket = async (req, res) => {
  const { searchTerm } = req.query;
  const tickets = await Ticket.searchTicket(searchTerm);
  res.json(tickets);
};

export const getAllTickets = async (req, res) => {
  const tickets = await Ticket.getAllTickets();
  res.json(tickets);
};

export const getTicketsByCustomerId = async (req, res) => {
  const { customerId } = req.params;
  const tickets = await Ticket.getTicketsByCustomerId(customerId);
  res.json(tickets);
};

export const addTicketOperation = async (req, res) => {
  const { id } = req.params;
  const { operation_id, ticket_operation_price } = req.body;
  const ticketOperation = await Ticket.addTicketOperation(id, operation_id, ticket_operation_price);
  res.json(ticketOperation);
};

export const updateTicketOperation = async (req, res) => {
  console.log("updateTicketOperation");
  console.log(req.body);
  const { operationId } = req.params;
  const { ticket_operation_price } = req.body;
  const ticketOperation = await Ticket.updateTicketOperation(operationId, ticket_operation_price);
  res.json(ticketOperation);
};

export const deleteTicketOperation = async (req, res) => {
  const { operationId } = req.params;
  const result = await Ticket.deleteTicketOperation(operationId);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
};

export const markTicketDelivered = async (req, res) => {
  const { id } = req.params;
  const result = await Ticket.markTicketDelivered(id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
};
