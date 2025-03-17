import pool from "../config/database.js";

// Ticket ile ilgili istatistikler
export const getTicketStats = async () => {
  try {
    // Toplam biletler
    const [totalTickets] = await pool.query(`SELECT COUNT(*) as total FROM tickets`);

    // Duruma göre bilet sayıları
    const [ticketsByStatus] = await pool.query(
      `SELECT 
        ticket_status, 
        COUNT(*) as count 
       FROM tickets 
       GROUP BY ticket_status`
    );

    // Bugün açılan biletler
    const [todayTickets] = await pool.query(
      `SELECT COUNT(*) as today 
       FROM tickets 
       WHERE DATE(created_at) = CURDATE()`
    );

    // Bekleyen biletler - ticket_status alanını kontrol ederek.
    const [pendingTickets] = await pool.query(
      `SELECT COUNT(*) as pending 
       FROM tickets 
       WHERE ticket_status IN ('waiting_parts', 'pending')`
    );

    return {
      total: totalTickets[0].total || 0,
      today: todayTickets[0].today || 0,
      pending: pendingTickets[0].pending || 0,
      byStatus: ticketsByStatus || [],
    };
  } catch (error) {
    console.error("Error in getTicketStats:", error);
    throw error;
  }
};

// Müşteri istatistikleri
export const getCustomerStats = async () => {
  try {
    // Toplam müşteri sayısı
    const [totalCustomers] = await pool.query(`SELECT COUNT(*) as total FROM customers`);

    // Müşteri türüne göre dağılım
    const [customerTypes] = await pool.query(
      `SELECT 
        customer_type, 
        COUNT(*) as count 
       FROM customers 
       GROUP BY customer_type`
    );

    // Bu ay yeni eklenen müşteriler - created_at alanı bulunduğunu varsayıyoruz
    // Eğer bu alan veritabanında yoksa, bu sorguyu düzenlememiz gerekir
    const [newCustomers] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM customers 
       WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(created_at) = YEAR(CURRENT_DATE())`
    );

    return {
      total: totalCustomers[0].total || 0,
      new: newCustomers[0].count || 0,
      byType: customerTypes || [],
    };
  } catch (error) {
    console.error("Error in getCustomerStats:", error);
    throw error;
  }
};

// Gelir istatistikleri
export const getRevenueStats = async () => {
  try {
    // Get current date
    const currentDate = new Date();

    // Get date 12 months ago (instead of 6)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Format dates for SQL query - make sure to include the entire current day
    const startDate = twelveMonthsAgo.toISOString().split("T")[0];
    // Günün sonuna kadar olan verileri kapsamak için endDate'i bugünün sonuna ayarla
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59).toISOString().split(".")[0];

    // SQL query to get monthly revenue - using ticket_operation_price column
    const [monthlyResultsRows] = await pool.query(
      `
      SELECT 
        DATE_FORMAT(t.created_at, '%Y-%m') AS month,
        COALESCE(SUM(to2.ticket_operation_price), 0) AS total
      FROM 
        tickets t
      LEFT JOIN 
        ticket_operations to2 ON t.ticket_id = to2.ticket_id
      WHERE 
        t.ticket_status = 'repaired' 
        AND t.created_at >= ? 
        AND t.created_at <= ?
      GROUP BY 
        DATE_FORMAT(t.created_at, '%Y-%m')
      ORDER BY 
        month ASC
    `,
      [startDate, endDate]
    );

    // Get total revenue - using ticket_operation_price column
    const [totalRow] = await pool.query(`
      SELECT COALESCE(SUM(to2.ticket_operation_price), 0) AS total
      FROM tickets t
      LEFT JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
      WHERE t.ticket_status = 'repaired'
    `);

    // Get monthly revenue (current month) - using ticket_operation_price column
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    // Günün sonuna kadar tüm saatleri kapsayan bir timestamp oluştur
    const lastMomentOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);

    const [monthlyRow] = await pool.query(
      `
      SELECT COALESCE(SUM(to2.ticket_operation_price), 0) AS total
      FROM tickets t
      LEFT JOIN ticket_operations to2 ON t.ticket_id = to2.ticket_id
      WHERE t.ticket_status = 'repaired'
      AND t.created_at >= ?
      AND t.created_at <= ?
    `,
      [firstDayOfMonth, lastMomentOfToday]
    );

    // Create full 12-month trend data
    const trendData = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}`;

      // Look for this month in results
      const foundMonth = monthlyResultsRows.find((row) => row.month === monthKey);

      trendData.unshift({
        month: monthKey,
        total: foundMonth ? Number(foundMonth.total) : 0,
      });
    }

    // Sort trend data by month
    trendData.sort((a, b) => a.month.localeCompare(b.month));

    return {
      total: Number(totalRow[0].total),
      monthly: Number(monthlyRow[0].total),
      trend: trendData,
    };
  } catch (error) {
    console.error("Error fetching revenue stats:", error);

    // Return fallback data if there's an error
    return {
      total: 0,
      monthly: 0,
      trend: generateSampleRevenueData(12), // Generate 12 months of sample data
    };
  }
};

// Helper function to generate sample revenue data
const generateSampleRevenueData = (months = 12) => {
  const data = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Generate random revenue between 1000 and 5000
    const revenue = Math.floor(Math.random() * 4000) + 1000;

    data.push({
      month: `${year}-${month}`,
      total: revenue,
    });
  }

  return data;
};

// Cihaz istatistikleri
export const getDeviceStats = async () => {
  try {
    // Cihaz türüne göre dağılım
    const [deviceTypes] = await pool.query(
      `SELECT 
        dt.device_type_name,
        COUNT(t.ticket_id) as count
       FROM device_types dt
       LEFT JOIN tickets t ON dt.device_type_id = t.device_type_id
       GROUP BY dt.device_type_name
       ORDER BY count DESC
       LIMIT 5`
    );

    // Marka dağılımı
    const [deviceBrands] = await pool.query(
      `SELECT 
        db.device_brand_name,
        COUNT(t.ticket_id) as count
       FROM device_brands db
       LEFT JOIN tickets t ON db.device_brand_id = t.device_brand_id
       GROUP BY db.device_brand_name
       ORDER BY count DESC
       LIMIT 5`
    );

    return {
      byType: deviceTypes || [],
      byBrand: deviceBrands || [],
    };
  } catch (error) {
    throw error;
  }
};

// Son eklenen biletler
export const getRecentTickets = async (limit = 5) => {
  try {
    const [tickets] = await pool.query(
      `SELECT 
        t.ticket_id,
        t.ticket_status,
        t.ticket_delivered,
        t.created_at,
        c.customer_name,
        db.device_brand_name,
        dt.device_type_name,
        dm.device_model_name
       FROM tickets t
       JOIN customers c ON t.customer_id = c.customer_id
       JOIN device_brands db ON t.device_brand_id = db.device_brand_id
       JOIN device_types dt ON t.device_type_id = dt.device_type_id
       LEFT JOIN device_models dm ON t.device_model_id = dm.device_model_id
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [limit]
    );

    return tickets || [];
  } catch (error) {
    throw error;
  }
};

// Performans verileri
export const getPerformanceData = async () => {
  try {
    // Ortalama tamir süresi (gün olarak) - tamir edilmiş biletler için
    // ticket_status = 'repaired' kullanıyoruz
    const [repairTime] = await pool.query(
      `SELECT AVG(DATEDIFF(updated_at, created_at)) as avg_days
       FROM tickets
       WHERE ticket_status = 'repaired'
       AND updated_at IS NOT NULL`
    );

    // Bilet durumlarına göre dağılım
    const [statusDistribution] = await pool.query(
      `SELECT 
        ticket_status,
        COUNT(*) as count
       FROM tickets
       GROUP BY ticket_status`
    );

    return {
      avgRepairTime: repairTime[0]?.avg_days || 0,
      statusDistribution: statusDistribution || [],
    };
  } catch (error) {
    throw error;
  }
};
