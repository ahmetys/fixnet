import pool from "../../config/database.js";

// Customer Reports
export const getCustomerStats = async () => {
  try {
    // Total customer count
    const [totalCustomersResult] = await pool.query(`SELECT COUNT(*) as total FROM customers`);

    // Distribution by customer type
    const [customerTypeDistribution] = await pool.query(
      `SELECT customer_type, COUNT(*) as count 
         FROM customers 
         GROUP BY customer_type`
    );

    // Top customers by ticket count
    const [topCustomersByTickets] = await pool.query(
      `SELECT 
          c.customer_id, 
          c.customer_name, 
          c.customer_type,
          COUNT(t.ticket_id) as ticket_count
         FROM customers c
         LEFT JOIN tickets t ON c.customer_id = t.customer_id
         WHERE t.ticket_delivered = TRUE
         GROUP BY c.customer_id
         ORDER BY ticket_count DESC
         LIMIT 10`
    );

    // Top customers by spending
    const [topCustomersBySpending] = await pool.query(
      `SELECT 
          c.customer_id, 
          c.customer_name, 
          c.customer_type,
          SUM(to2.ticket_operation_price) as total_spent
         FROM customers c
         JOIN tickets t ON c.customer_id = t.customer_id
         JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
         WHERE t.ticket_delivered = TRUE AND t.ticket_status = 'repaired'
         GROUP BY c.customer_id
         ORDER BY total_spent DESC
         LIMIT 10`
    );

    return {
      totalCustomers: totalCustomersResult[0].total,
      typeDistribution: customerTypeDistribution,
      topCustomersByTickets,
      topCustomersBySpending,
    };
  } catch (error) {
    console.error("Error in getCustomerStats:", error);
    throw error;
  }
};
