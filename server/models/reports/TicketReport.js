import pool from "../../config/database.js";

// Helper function to fill missing dates in the data
const fillMissingDates = (data, days, interval) => {
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
      const filledWeeklyData = fillMissingDates(weeklyData, 7, "daily");
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

      const filledMonthlyData = fillMissingDates(formattedMonthlyData, 5, "weekly");
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
      const filledYearlyData = fillMissingDates(yearlyData, 12, "monthly");
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
