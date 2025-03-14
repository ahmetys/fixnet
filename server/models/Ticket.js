import pool from "../config/database.js";

export const getAllTickets = async () => {
  const [rows] = await pool.query("SELECT tickets.*,customers.customer_name,device_models.device_model_name FROM tickets LEFT JOIN customers ON tickets.customer_id = customers.customer_id LEFT JOIN device_models ON tickets.device_model_id = device_models.device_model_id ORDER BY created_at DESC");
  return rows;
};

export const getTicketById = async (id) => {
  // Ana ticket ve ilişkili verileri çek
  const [rows] = await pool.query(
    `SELECT 
        t.*,
        c.customer_id,c.customer_type, c.customer_name, c.customer_phone, c.customer_email, c.customer_address,
        dt.device_type_id, dt.device_type_name,
        db.device_brand_id, db.device_brand_name,
        dm.device_model_id, dm.device_model_name
    FROM 
        tickets t
    LEFT JOIN 
        customers c ON t.customer_id = c.customer_id
    LEFT JOIN 
        device_types dt ON t.device_type_id = dt.device_type_id
    LEFT JOIN 
        device_brands db ON t.device_brand_id = db.device_brand_id
    LEFT JOIN 
        device_models dm ON t.device_model_id = dm.device_model_id
    WHERE 
        t.ticket_id = ?`,
    [id]
  );

  // Operasyonlar için ayrı sorgu
  const [operations] = await pool.query(
    `SELECT 
        to2.ticket_operation_id, 
        to2.ticket_id,
        to2.operation_id, 
        to2.ticket_operation_price,
        o.operation_name
    FROM 
        ticket_operations to2
    LEFT JOIN 
        operations o ON to2.operation_id = o.operation_id
    WHERE 
        to2.ticket_id = ?`,
    [id]
  );

  // Eğer ticket bulunamadıysa null döndür
  if (!rows[0]) return null;

  // Ticket bilgilerine operasyonları ekle
  const ticket = rows[0];
  ticket.operations = operations;

  return ticket;
};

export const createTicket = async (ticket) => {
  const { customer_name, order_spare_parts, operation_ids, device_type_name, device_brand_name, device_model_name, ...ticketData } = ticket;
  const [rows] = await pool.query("INSERT INTO tickets SET ?", [ticketData]);
  console.log(operation_ids);

  // Add ticket_id to each operation object
  const operationsWithTicketId = operation_ids.map((operation) => ({
    ...operation,
    ticket_id: rows.insertId,
  }));
  console.log(operationsWithTicketId);
  // Insert operations into ticket_operations
  const [operationRows] = await pool.query("INSERT INTO ticket_operations (operation_id, ticket_id, ticket_operation_price) VALUES ?", [operationsWithTicketId.map((op) => [op.operation_id, op.ticket_id, op.ticket_operation_price])]);

  return { ticket_id: rows.insertId };
};

export const updateTicket = async (id, ticket) => {
  console.log("ticket");
  console.log(ticket);

  const [rows] = await pool.query("UPDATE tickets SET ? WHERE ticket_id = ?", [ticket, id]);
  return rows[0];
};

export const deleteTicket = async (id) => {
  const [rows] = await pool.query("DELETE FROM tickets WHERE ticket_id = ?", [id]);
  return rows[0];
};

// Get tickets by customer ID
export const getTicketsByCustomerId = async (customerId) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT tickets.*,device_models.device_model_name FROM tickets LEFT JOIN device_models ON tickets.device_model_id = device_models.device_model_id WHERE customer_id = ? ORDER BY created_at DESC
    `,
      [customerId]
    );

    return rows;
  } catch (error) {
    console.error("Error in getTicketsByCustomerId:", error);
    throw error;
  }
};

export const addTicketOperation = async (id, operation_id, ticket_operation_price) => {
  try {
    if (!operation_id || !ticket_operation_price) {
      return {
        success: false,
        message: "Operation ID and price are required",
      };
    }
    const [result] = await pool.query(
      `INSERT INTO ticket_operations 
       (ticket_id, operation_id, ticket_operation_price) 
       VALUES (?, ?, ?)`,
      [id, operation_id, ticket_operation_price]
    );
    return {
      success: true,
      message: "Operation added successfully",
      ticket_operation_id: result.insertId,
    };
  } catch (error) {
    console.error("Error adding ticket operation:", error);
    return {
      success: false,
      message: "An error occurred while adding the operation",
    };
  }
};

export const updateTicketOperation = async (operationId, price) => {
  try {
    const [result] = await pool.query(
      `UPDATE ticket_operations 
       SET ticket_operation_price = ? 
       WHERE ticket_operation_id = ?`,
      [price, operationId]
    );

    if (!price) {
      return {
        success: false,
        message: "Operation price is required",
      };
    }

    return {
      success: true,
      message: "Operation updated successfully",
    };
  } catch (error) {
    console.error("Error updating ticket operation:", error);
    return {
      success: false,
      message: "An error occurred while updating the operation",
    };
  }
};

export const deleteTicketOperation = async (operationId) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM ticket_operations 
       WHERE ticket_operation_id = ?`,
      [operationId]
    );

    return {
      success: true,
      message: "Operation deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting ticket operation:", error);
    return {
      success: false,
      message: "An error occurred while deleting the operation",
    };
  }
};

export const markTicketDelivered = async (id) => {
  try {
    const [result] = await pool.query(
      `UPDATE tickets 
       SET ticket_delivered = TRUE 
       WHERE ticket_id = ?`,
      [id]
    );

    return {
      success: true,
      message: "Ticket marked as delivered successfully",
    };
  } catch (error) {
    console.error("Error marking ticket as delivered:", error);
    return {
      success: false,
      message: "An error occurred while marking the ticket as delivered",
    };
  }
};
