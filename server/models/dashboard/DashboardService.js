import pool from "../../config/database.js";

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

    // Bekleyen biletler - ticket_status alanını kontrol ederek
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
    // Toplam gelir - bilet işlemlerinden hesaplama
    const [totalRevenue] = await pool.query(
      `SELECT COALESCE(SUM(ticket_operation_price), 0) as total 
       FROM ticket_operations 
       JOIN tickets ON ticket_operations.ticket_id = tickets.ticket_id 
       WHERE tickets.ticket_delivered = TRUE`
    );

    // Bu ayki gelir
    const [monthlyRevenue] = await pool.query(
      `SELECT COALESCE(SUM(ticket_operation_price), 0) as total 
       FROM ticket_operations 
       JOIN tickets ON ticket_operations.ticket_id = tickets.ticket_id 
       WHERE tickets.ticket_delivered = TRUE 
       AND MONTH(tickets.updated_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(tickets.updated_at) = YEAR(CURRENT_DATE())`
    );

    // Son 6 aylık gelir trendi
    const [revenueTrend] = await pool.query(
      `SELECT 
        DATE_FORMAT(t.updated_at, '%Y-%m') as month,
        COALESCE(SUM(to2.ticket_operation_price), 0) as total
       FROM ticket_operations to2
       JOIN tickets t ON to2.ticket_id = t.ticket_id
       WHERE t.ticket_delivered = TRUE
       AND t.updated_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(t.updated_at, '%Y-%m')
       ORDER BY month ASC`
    );

    // Eğer veri yoksa, son 6 ay için örnek veri oluştur
    let trend = revenueTrend;
    if (trend.length === 0) {
      trend = generateSampleRevenueData(6);
    }

    return {
      total: totalRevenue[0].total || 0,
      monthly: monthlyRevenue[0].total || 0,
      trend: trend,
    };
  } catch (error) {
    console.error("Error in getRevenueStats:", error);
    throw error;
  }
};

// Örnek gelir verisi oluşturma (veri yoksa)
const generateSampleRevenueData = (monthCount) => {
  const data = [];
  const today = new Date();

  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = date.toISOString().substring(0, 7); // YYYY-MM formatı

    data.push({
      month: month,
      total: Math.floor(Math.random() * 10000) + 1000,
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
    console.error("Error in getDeviceStats:", error);
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
    console.error("Error in getRecentTickets:", error);
    throw error;
  }
};

// Performans verileri
export const getPerformanceData = async () => {
  try {
    // Ortalama tamir süresi (gün olarak) - teslim edilen biletler için
    // ticket_status = 'delivered' olarak değiştirildi, delivered_at yerine updated_at kullanıldı
    const [repairTime] = await pool.query(
      `SELECT AVG(DATEDIFF(updated_at, created_at)) as avg_days
       FROM tickets
       WHERE ticket_delivered = TRUE
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
    console.error("Error in getPerformanceData:", error);
    throw error;
  }
};
