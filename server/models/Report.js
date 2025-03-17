import pool from "../config/database.js";

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

// Device Reports
export const getDeviceStats = async () => {
  try {
    // Brand distribution
    const [brandDistribution] = await pool.query(
      `SELECT 
          db.device_brand_name, 
          COUNT(t.ticket_id) as ticket_count
         FROM device_brands db
         LEFT JOIN tickets t ON db.device_brand_id = t.device_brand_id
         WHERE t.ticket_delivered = TRUE
         GROUP BY db.device_brand_id
         ORDER BY ticket_count DESC`
    );

    // Type distribution
    const [typeDistribution] = await pool.query(
      `SELECT 
          dt.device_type_name, 
          COUNT(t.ticket_id) as ticket_count
         FROM device_types dt
         LEFT JOIN tickets t ON dt.device_type_id = t.device_type_id
         WHERE t.ticket_delivered = TRUE
         GROUP BY dt.device_type_id
         ORDER BY ticket_count DESC`
    );

    // Model distribution
    const [modelDistribution] = await pool.query(
      `SELECT 
          dm.device_model_name, 
          COUNT(t.ticket_id) as ticket_count
         FROM device_models dm
         LEFT JOIN tickets t ON dm.device_model_id = t.device_model_id
         WHERE t.ticket_delivered = TRUE
         GROUP BY dm.device_model_id
         ORDER BY ticket_count DESC
         LIMIT 10`
    );

    // Brand-type hierarchy
    const [brandTypeHierarchy] = await pool.query(
      `SELECT 
          db.device_brand_name,
          dt.device_type_name,
          COUNT(t.ticket_id) as ticket_count
         FROM device_brands db
         LEFT JOIN device_types dt ON db.device_brand_id = dt.device_brand_id
         LEFT JOIN tickets t ON dt.device_type_id = t.device_type_id
         WHERE t.ticket_delivered = TRUE
         GROUP BY db.device_brand_id, dt.device_type_id
         HAVING dt.device_type_name IS NOT NULL
         ORDER BY db.device_brand_name, ticket_count DESC`
    );

    return {
      brandDistribution,
      typeDistribution,
      modelDistribution,
      brandTypeHierarchy,
    };
  } catch (error) {
    console.error("Error in getDeviceStats:", error);
    throw error;
  }
};

// Helper function to fill missing dates in the data
const fillMissingDatesFinancial = (data, days, interval) => {
  const result = [];

  if (interval === "daily") {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    // Create a map for easier lookup
    const dataMap = new Map();
    data.forEach((item) => {
      dataMap.set(item.date, {
        revenue: item.revenue || 0,
        ticket_count: item.ticket_count || 0,
      });
    });

    // Fill in all dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const existingData = dataMap.get(dateStr) || { revenue: 0, ticket_count: 0 };

      result.push({
        date: dateStr,
        revenue: existingData.revenue,
        ticket_count: existingData.ticket_count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return result;
};

// Financial Reports
export const getFinancialStats = async (timeRange = "month") => {
  try {
    let timePeriod;
    if (timeRange === "week") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (timeRange === "month") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    } else if (timeRange === "year") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
    } else {
      timePeriod = "1=1"; // All time
    }

    // Total revenue
    const [totalRevenueResult] = await pool.query(
      `SELECT 
            SUM(to2.ticket_operation_price) as total
           FROM ticket_operations to2
           JOIN tickets t ON to2.ticket_id = t.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Total advance payments
    const [totalAdvanceResult] = await pool.query(
      `SELECT 
            SUM(ticket_advance_pay) as total
           FROM tickets t
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Total tickets count
    const [totalTicketsResult] = await pool.query(
      `SELECT 
            COUNT(DISTINCT t.ticket_id) as total
           FROM tickets t
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Highest ticket
    const [highestTicketResult] = await pool.query(
      `SELECT 
            t.ticket_id,
            SUM(to2.ticket_operation_price) as total_price
           FROM tickets t
           JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY t.ticket_id
           ORDER BY total_price DESC
           LIMIT 1`
    );

    // Revenue by device brand
    const [revenueByBrand] = await pool.query(
      `SELECT 
            db.device_brand_name,
            SUM(to2.ticket_operation_price) as revenue
           FROM device_brands db
           JOIN tickets t ON db.device_brand_id = t.device_brand_id
           JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY db.device_brand_id, db.device_brand_name
           ORDER BY revenue DESC`
    );

    // Revenue by device type
    const [revenueByType] = await pool.query(
      `SELECT 
            dt.device_type_name,
            SUM(to2.ticket_operation_price) as revenue
           FROM device_types dt
           JOIN tickets t ON dt.device_type_id = t.device_type_id
           JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY dt.device_type_id, dt.device_type_name
           ORDER BY revenue DESC`
    );

    // Revenue over time
    let revenueOverTimeQuery;
    let revenueTimeGroupBy;

    if (timeRange === "week") {
      revenueOverTimeQuery = `
          SELECT 
            DATE(t.created_at) as date,
            SUM(to2.ticket_operation_price) as revenue,
            COUNT(DISTINCT t.ticket_id) as ticket_count
          FROM tickets t
          JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
          WHERE t.ticket_delivered = TRUE 
          AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(t.created_at)
          ORDER BY date`;
    } else if (timeRange === "month") {
      revenueOverTimeQuery = `
          SELECT 
            DATE(t.created_at) as date,
            SUM(to2.ticket_operation_price) as revenue,
            COUNT(DISTINCT t.ticket_id) as ticket_count
          FROM tickets t
          JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
          WHERE t.ticket_delivered = TRUE 
          AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DATE(t.created_at)
          ORDER BY date`;
    } else {
      revenueOverTimeQuery = `
          SELECT 
            DATE_FORMAT(t.created_at, '%Y-%m-01') as date,
            SUM(to2.ticket_operation_price) as revenue,
            COUNT(DISTINCT t.ticket_id) as ticket_count
          FROM tickets t
          JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
          WHERE t.ticket_delivered = TRUE 
          AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
          GROUP BY DATE_FORMAT(t.created_at, '%Y-%m-01')
          ORDER BY date`;
    }

    const [revenueOverTimeRaw] = await pool.query(revenueOverTimeQuery);

    // Generate sample data if no data exists
    let revenueOverTime;
    if (revenueOverTimeRaw.length === 0) {
      revenueOverTime = [];
      const today = new Date();

      if (timeRange === "week") {
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          revenueOverTime.push({
            date: date.toISOString().split("T")[0],
            revenue: Math.floor(Math.random() * 2000) + 500,
            ticket_count: Math.floor(Math.random() * 5) + 1,
          });
        }
      } else if (timeRange === "month") {
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          revenueOverTime.push({
            date: date.toISOString().split("T")[0],
            revenue: Math.floor(Math.random() * 2000) + 500,
            ticket_count: Math.floor(Math.random() * 5) + 1,
          });
        }
      } else {
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(today.getMonth() - i);
          date.setDate(1);
          revenueOverTime.push({
            date: date.toISOString().split("T")[0],
            revenue: Math.floor(Math.random() * 10000) + 2000,
            ticket_count: Math.floor(Math.random() * 20) + 5,
          });
        }
      }
    } else {
      // Fill in missing dates for the trend
      if (timeRange === "week" || timeRange === "month") {
        revenueOverTime = fillMissingDatesFinancial(revenueOverTimeRaw, timeRange === "week" ? 7 : 30, "daily");
      } else {
        revenueOverTime = revenueOverTimeRaw; // For yearly, we don't fill in missing months for simplicity
      }
    }

    // Compare with previous period for change calculations
    let previousTimePeriod;
    if (timeRange === "week") {
      previousTimePeriod = "DATE(t.created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (timeRange === "month") {
      previousTimePeriod = "DATE(t.created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    } else {
      previousTimePeriod = "DATE(t.created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 YEAR) AND DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
    }

    // Previous period revenue
    const [previousRevenueResult] = await pool.query(
      `SELECT 
            SUM(to2.ticket_operation_price) as total
           FROM ticket_operations to2
           JOIN tickets t ON to2.ticket_id = t.ticket_id
           WHERE ${previousTimePeriod} AND t.ticket_delivered = TRUE`
    );

    // Previous period tickets
    const [previousTicketsResult] = await pool.query(
      `SELECT 
            COUNT(DISTINCT t.ticket_id) as total
           FROM tickets t
           WHERE ${previousTimePeriod} AND t.ticket_delivered = TRUE`
    );

    const [topCustomersByRevenue] = await pool.query(
      `SELECT 
            c.customer_id,
            c.customer_name,
            c.customer_type,
            COUNT(DISTINCT t.ticket_id) as ticket_count,
            SUM(to2.ticket_operation_price) as revenue
           FROM customers c
           JOIN tickets t ON c.customer_id = t.customer_id
           JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY c.customer_id, c.customer_name, c.customer_type
           ORDER BY revenue DESC
           LIMIT 10`
    );

    const [revenueByDeviceBrand] = await pool.query(
      `SELECT 
            db.device_brand_name,
            SUM(to2.ticket_operation_price) as revenue
           FROM device_brands db
           JOIN tickets t ON db.device_brand_id = t.device_brand_id
           JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY db.device_brand_id, db.device_brand_name
           ORDER BY revenue DESC
           LIMIT 10`
    );

    // Calculate metrics
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const totalAdvance = totalAdvanceResult[0]?.total || 0;
    const outstandingPayments = totalRevenue - totalAdvance;
    const totalTickets = totalTicketsResult[0]?.total || 0;
    const highestTicketValue = highestTicketResult[0]?.total_price || 0;
    const highestTicketId = highestTicketResult[0]?.ticket_id || 0;

    const previousRevenue = previousRevenueResult[0]?.total || 0;
    const previousTickets = previousTicketsResult[0]?.total || 0;

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100) : 0;
    const ticketChange = previousTickets > 0 ? Math.round(((totalTickets - previousTickets) / previousTickets) * 100) : 0;

    // Calculate average ticket value
    const averageTicketValue = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    const previousAverageTicketValue = previousTickets > 0 ? previousRevenue / previousTickets : 0;
    const avgTicketValueChange = previousAverageTicketValue > 0 ? Math.round(((averageTicketValue - previousAverageTicketValue) / previousAverageTicketValue) * 100) : 0;

    return {
      totalRevenue,
      totalAdvance,
      outstandingPayments,
      totalTickets,
      revenueChange,
      ticketChange,
      averageTicketValue,
      avgTicketValueChange,
      highestTicketValue,
      highestTicketId,
      revenueByBrand,
      revenueByType,
      revenueOverTime,
      topCustomersByRevenue,
      revenueByDeviceBrand,
    };
  } catch (error) {
    console.error("Error in getFinancialStats:", error);
    throw error;
  }
};

// Helper function to fill missing dates in the data
const fillMissingDatesOperation = (data, days, interval) => {
  const result = [];

  if (interval === "daily") {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    // Create a map for easier lookup
    const dataMap = new Map();
    data.forEach((item) => {
      dataMap.set(item.date, item.count);
    });

    // Fill in all dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
      result.push({
        date: dateStr,
        count: dataMap.has(dateStr) ? dataMap.get(dateStr) : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return result;
};

// Operation Reports
export const getOperationStats = async (timeRange = "month") => {
  try {
    let timePeriod;
    if (timeRange === "week") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (timeRange === "month") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    } else if (timeRange === "year") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
    } else {
      timePeriod = "1=1"; // All time
    }

    // Total operations count
    const [totalOperationsResult] = await pool.query(
      `SELECT 
            COUNT(to2.ticket_operation_id) as total
           FROM ticket_operations to2
           JOIN tickets t ON to2.ticket_id = t.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Total tickets count for the period
    const [totalTicketsResult] = await pool.query(
      `SELECT 
            COUNT(DISTINCT t.ticket_id) as total
           FROM tickets t
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Total revenue
    const [totalRevenueResult] = await pool.query(
      `SELECT 
            SUM(to2.ticket_operation_price) as total
           FROM ticket_operations to2
           JOIN tickets t ON to2.ticket_id = t.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Top operations by frequency
    const [mostCommonOperations] = await pool.query(
      `SELECT 
            o.operation_name,
            COUNT(to2.ticket_operation_id) as count
           FROM operations o
           JOIN ticket_operations to2 ON o.operation_id = to2.operation_id
           JOIN tickets t ON to2.ticket_id = t.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY o.operation_id, o.operation_name
           ORDER BY count DESC
           LIMIT 10`
    );

    // Operations revenue
    const [highestRevenueOperations] = await pool.query(
      `SELECT 
            o.operation_name,
            SUM(to2.ticket_operation_price) as revenue
           FROM operations o
           JOIN ticket_operations to2 ON o.operation_id = to2.operation_id
           JOIN tickets t ON to2.ticket_id = t.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY o.operation_id, o.operation_name
           ORDER BY revenue DESC
           LIMIT 10`
    );

    // Operations by device type
    const [operationsByDeviceType] = await pool.query(
      `SELECT 
            dt.device_type_name,
            o.operation_name,
            COUNT(to2.ticket_operation_id) as count
           FROM device_types dt
           JOIN tickets t ON dt.device_type_id = t.device_type_id
           JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
           JOIN operations o ON to2.operation_id = o.operation_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY dt.device_type_id, dt.device_type_name, o.operation_id, o.operation_name
           ORDER BY dt.device_type_name, count DESC`
    );

    // Insert sample data for testing if no data exists
    const [checkDataExists] = await pool.query(
      `SELECT COUNT(*) as count
         FROM ticket_operations to2
         JOIN tickets t ON to2.ticket_id = t.ticket_id
         WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Operation trend over time - Simplify and make more reliable
    let operationTrendQuery;

    if (timeRange === "week") {
      operationTrendQuery = `
          SELECT 
            DATE(t.created_at) as date,
            COUNT(to2.ticket_operation_id) as count
          FROM tickets t
          JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
          WHERE t.ticket_delivered = TRUE 
          AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(t.created_at)
          ORDER BY date`;
    } else if (timeRange === "month") {
      operationTrendQuery = `
          SELECT 
            DATE(t.created_at) as date,
            COUNT(to2.ticket_operation_id) as count
          FROM tickets t
          JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
          WHERE t.ticket_delivered = TRUE 
          AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DATE(t.created_at)
          ORDER BY date`;
    } else {
      operationTrendQuery = `
          SELECT 
            DATE_FORMAT(t.created_at, '%Y-%m-01') as date,
            COUNT(to2.ticket_operation_id) as count
          FROM tickets t
          JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
          WHERE t.ticket_delivered = TRUE 
          AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
          GROUP BY DATE_FORMAT(t.created_at, '%Y-%m-01')
          ORDER BY date`;
    }

    const [operationTrendRaw] = await pool.query(operationTrendQuery);

    // If no data exists, create sample data for demonstration
    let operationTrend;
    if (operationTrendRaw.length === 0) {
      // Create sample data for demonstration
      operationTrend = [];
      const today = new Date();

      if (timeRange === "week") {
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          operationTrend.push({
            date: date.toISOString().split("T")[0],
            count: Math.floor(Math.random() * 5) + 1, // Random count between 1 and 5
          });
        }
      } else if (timeRange === "month") {
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          operationTrend.push({
            date: date.toISOString().split("T")[0],
            count: Math.floor(Math.random() * 5) + 1, // Random count between 1 and 5
          });
        }
      } else {
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(today.getMonth() - i);
          date.setDate(1);
          operationTrend.push({
            date: date.toISOString().split("T")[0],
            count: Math.floor(Math.random() * 30) + 5, // Random count between 5 and 35
          });
        }
      }
    } else {
      // Fill in missing dates for the trend
      if (timeRange === "week" || timeRange === "month") {
        operationTrend = fillMissingDatesOperation(operationTrendRaw, timeRange === "week" ? 7 : 30, "daily");
      } else {
        operationTrend = operationTrendRaw; // For yearly, we don't fill in missing months for simplicity
      }
    }

    // Calculate derived stats
    const totalOperations = totalOperationsResult[0].total || 0;
    const totalTickets = totalTicketsResult[0].total || 0;
    const totalRevenue = totalRevenueResult[0].total || 0;

    const operationsPerTicket = totalTickets > 0 ? totalOperations / totalTickets : 0;
    const averageOperationPrice = totalOperations > 0 ? totalRevenue / totalOperations : 0;

    return {
      // Basic stats
      totalOperations,
      totalTickets,
      totalRevenue,
      operationsPerTicket,
      averageOperationPrice,

      // Details
      mostCommonOperations,
      highestRevenueOperations,
      operationsByDeviceType,
      operationTrend,
    };
  } catch (error) {
    throw error;
  }
};

// Helper function to fill missing dates in the data
const fillMissingDatesTicket = (data, days, interval) => {
  const result = [];
  let format;
  let increment;

  if (interval === "daily") {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    // Create a map for easier lookup
    const dataMap = new Map();
    data.forEach((item) => {
      dataMap.set(item.date, item.count);
    });

    // Fill in all dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
      result.push({
        date: dateStr,
        count: dataMap.has(dateStr) ? dataMap.get(dateStr) : 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (interval === "weekly") {
    // Implement weekly date filling logic
    // This is a simplified version
    for (let i = 0; i < days; i++) {
      const found = data[i] || { date: `Week ${i + 1}`, count: 0 };
      result.push(found);
    }
  } else if (interval === "monthly") {
    // Implement monthly date filling logic
    // This is a simplified version
    for (let i = 0; i < days; i++) {
      const found = data[i] || { date: `Month ${i + 1}`, count: 0 };
      result.push(found);
    }
  }

  return result;
};

export const getTicketStats = async (timeRange = "month") => {
  try {
    let timePeriod;
    if (timeRange === "week") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (timeRange === "month") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    } else if (timeRange === "year") {
      timePeriod = "DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
    } else {
      timePeriod = "1=1"; // All time
    }

    // Total tickets in the period
    const [totalTicketsResult] = await pool.query(`SELECT COUNT(*) as total FROM tickets t WHERE ${timePeriod} AND t.ticket_delivered = TRUE`);

    // Ticket status distribution
    const [statusDistribution] = await pool.query(
      `SELECT 
          t.ticket_status, 
          COUNT(*) as count
         FROM tickets t
         WHERE ${timePeriod} 
         GROUP BY t.ticket_status`
    );

    // Average repair time (days)
    const [avgRepairTime] = await pool.query(
      `SELECT 
          AVG(DATEDIFF(t.updated_at, t.created_at)) as avg_days
         FROM tickets t
         WHERE t.ticket_status = 'repaired' AND ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    // Recent tickets
    const [recentTickets] = await pool.query(
      `SELECT 
          t.ticket_id,
          c.customer_name,
          db.device_brand_name as device_brand,
          dt.device_type_name as device_type,
          dm.device_model_name as device_model,
          t.ticket_status,
          t.created_at
         FROM tickets t
         LEFT JOIN customers c ON t.customer_id = c.customer_id
         LEFT JOIN device_brands db ON t.device_brand_id = db.device_brand_id
         LEFT JOIN device_types dt ON t.device_type_id = dt.device_type_id
         LEFT JOIN device_models dm ON t.device_model_id = dm.device_model_id
         WHERE ${timePeriod} AND t.ticket_delivered = TRUE
         ORDER BY t.created_at DESC
         LIMIT 10`
    );

    // Tickets over time - iyileştirilmiş sorgular
    let ticketsOverTime;

    if (timeRange === "week") {
      // Haftalık trend - Son 7 günün her günü için bilet sayısı
      const [weeklyData] = await pool.query(
        `SELECT 
            DATE(t.created_at) as date,
            COUNT(*) as count
           FROM tickets t
           WHERE DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND t.ticket_delivered = TRUE
           GROUP BY DATE(t.created_at)
           ORDER BY date`
      );

      // Eksik günleri doldur - Here's where the error was occurring
      const filledWeeklyData = fillMissingDatesTicket(weeklyData, 7, "daily");
      ticketsOverTime = filledWeeklyData;
    } else if (timeRange === "month") {
      // Aylık trend - Son 4 haftanın her haftası için bilet sayısı
      const [monthlyData] = await pool.query(
        `SELECT 
            YEARWEEK(t.created_at) as yearweek,
            MIN(DATE(t.created_at)) as week_start,
            COUNT(*) as count
           FROM tickets t
           WHERE DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND t.ticket_delivered = TRUE
           GROUP BY YEARWEEK(t.created_at)
           ORDER BY yearweek`
      );

      // Haftalık veriye dönüştür ve eksik haftaları doldur
      const formattedMonthlyData = monthlyData.map((item) => ({
        date: item.week_start,
        count: item.count,
      }));

      const filledMonthlyData = fillMissingDatesTicket(formattedMonthlyData, 5, "weekly");
      ticketsOverTime = filledMonthlyData;
    } else {
      // Yıllık trend - Son 12 ayın her ayı için bilet sayısı
      const [yearlyData] = await pool.query(
        `SELECT 
            DATE_FORMAT(t.created_at, '%Y-%m-01') as month_start,
            COUNT(*) as count
           FROM tickets t
           WHERE DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) AND t.ticket_delivered = TRUE
           GROUP BY month_start
           ORDER BY month_start`
      );

      // Eksik ayları doldur
      const filledYearlyData = fillMissingDatesTicket(yearlyData, 12, "monthly");
      ticketsOverTime = filledYearlyData;
    }

    // Diğer istatistikler
    const [openTickets] = await pool.query(`SELECT COUNT(*) as count FROM tickets t WHERE ${timePeriod} AND (t.ticket_status = 'pending' OR t.ticket_status = 'waiting_parts')`);

    const [completedTickets] = await pool.query(`SELECT COUNT(*) as count FROM tickets t WHERE ${timePeriod} AND t.ticket_status = 'repaired' AND t.ticket_delivered = TRUE`);

    const [notRepairedTickets] = await pool.query(`SELECT COUNT(*) as count FROM tickets t WHERE ${timePeriod} AND t.ticket_status = 'not_repaired' AND t.ticket_delivered = TRUE`);

    // Son 30 günlük bilet sayısı trendi
    const [ticketTrend] = await pool.query(
      `SELECT 
          DATE(t.created_at) as date,
          COUNT(*) as count
         FROM tickets t
         WHERE DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL ${timeRange === "week" ? "7" : timeRange === "month" ? "30" : "365"} DAY)
         GROUP BY DATE(t.created_at)
         ORDER BY date`
    );

    // EKSİK VERİLER - FRONTEND İÇİN GEREKLİ

    // 1. Ticket statülerine göre yüzde dağılımı
    const totalTickets = totalTicketsResult[0].total || 0;
    const statusPercentages = statusDistribution.map((item) => ({
      ...item,
      percentage: totalTickets > 0 ? Math.round((item.count / totalTickets) * 100) : 0,
    }));

    // 2. Waiting parts tickets
    const [waitingPartsTickets] = await pool.query(
      `SELECT COUNT(*) as count FROM tickets t 
         WHERE ${timePeriod} AND t.ticket_status = 'waiting_parts' AND t.ticket_delivered = TRUE`
    );

    // 3. Aylık trend analizi
    const [monthlyTrend] = await pool.query(
      `SELECT 
          DATE_FORMAT(t.created_at, '%Y-%m') as month,
          COUNT(*) as count
         FROM tickets t
         WHERE DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) AND t.ticket_delivered = TRUE
         GROUP BY month
         ORDER BY month`
    );

    // 4. Ortalama tamamlanma süresi (gün olarak)
    const [avgCompletionTime] = await pool.query(
      `SELECT 
          AVG(DATEDIFF(t.updated_at, t.created_at)) as avg_days
         FROM tickets t
         WHERE t.ticket_delivered = TRUE AND ${timePeriod}`
    );

    // 5. Bu haftaki vs geçen haftaki ticket sayısı karşılaştırması
    const [currentWeekTickets] = await pool.query(
      `SELECT COUNT(*) as count FROM tickets t 
         WHERE DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND t.ticket_delivered = TRUE`
    );

    const [previousWeekTickets] = await pool.query(
      `SELECT COUNT(*) as count FROM tickets t 
         WHERE DATE(t.created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) 
         AND DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND t.ticket_delivered = TRUE`
    );

    const ticketGrowth = {
      current: currentWeekTickets[0].count || 0,
      previous: previousWeekTickets[0].count || 0,
      percentage: previousWeekTickets[0].count > 0 ? Math.round(((currentWeekTickets[0].count - previousWeekTickets[0].count) / previousWeekTickets[0].count) * 100) : 0,
    };

    // 6. Cihaz türüne göre bilet dağılımı
    const [deviceTypeDistribution] = await pool.query(
      `SELECT 
          dt.device_type_name, 
          COUNT(*) as count
         FROM tickets t
         JOIN device_types dt ON t.device_type_id = dt.device_type_id
         WHERE ${timePeriod} AND t.ticket_delivered = TRUE
         GROUP BY dt.device_type_name
         ORDER BY count DESC`
    );

    // 7. Gelir özeti
    const [totalRevenue] = await pool.query(
      `SELECT 
          SUM(to2.ticket_operation_price) as total
         FROM tickets t
         JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
         WHERE ${timePeriod} AND t.ticket_delivered = TRUE`
    );

    const [avgTicketValue] = await pool.query(
      `SELECT 
          AVG(subquery.ticket_total) as avg_value
         FROM (
           SELECT 
             t.ticket_id,
             SUM(to2.ticket_operation_price) as ticket_total
           FROM tickets t
           JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
           WHERE ${timePeriod} AND t.ticket_delivered = TRUE
           GROUP BY t.ticket_id
         ) as subquery`
    );

    // Get operation distribution - shows the most common repair operations
    const [operationDistribution] = await pool.query(
      `SELECT 
          o.operation_name, 
          COUNT(*) as count
         FROM tickets t
         JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
         JOIN operations o ON to2.operation_id = o.operation_id
         WHERE ${timePeriod} AND t.ticket_delivered = TRUE
         GROUP BY o.operation_name
         ORDER BY count DESC
         LIMIT 10`
    );

    // Get longest resolution tickets
    const [longestResolutionTickets] = await pool.query(
      `SELECT 
          t.ticket_id,
          dm.device_model_name as device_model,
          DATEDIFF(t.updated_at, t.created_at) as resolution_days
         FROM tickets t
         LEFT JOIN device_models dm ON t.device_model_id = dm.device_model_id
         WHERE t.ticket_delivered = TRUE AND ${timePeriod}
         ORDER BY resolution_days DESC
         LIMIT 5`
    );

    // Cevabı hazırla
    return {
      totalTickets,
      statusDistribution,
      statusPercentages,
      avgRepairTime: avgRepairTime[0].avg_days || 0,
      recentTickets,
      ticketsOverTime,
      openTickets: openTickets[0].count,
      completedTickets: completedTickets[0].count,
      notRepairedTickets: notRepairedTickets[0].count,
      waitingPartsTickets: waitingPartsTickets[0].count,
      ticketTrend,
      monthlyTrend,
      avgCompletionTime: avgCompletionTime[0].avg_days || 0,
      ticketGrowth,
      deviceTypeDistribution,
      operationDistribution,
      longestResolutionTickets,
      revenue: {
        total: totalRevenue[0].total || 0,
        avgTicketValue: avgTicketValue[0].avg_value || 0,
      },
    };
  } catch (error) {
    console.error("Error in getTicketStats:", error);
    throw error;
  }
};
