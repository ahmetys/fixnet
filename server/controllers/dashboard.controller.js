import * as DashboardService from "../models/DashboardService.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Temel istatistikleri al
    const [ticketStats, customerStats, revenueStats, deviceStats, recentTickets, performanceData] = await Promise.all([
      DashboardService.getTicketStats(),
      DashboardService.getCustomerStats(),
      DashboardService.getRevenueStats(),
      DashboardService.getDeviceStats(),
      DashboardService.getRecentTickets(10), // Son 10 ticket
      DashboardService.getPerformanceData(),
    ]);

    res.status(200).json({
      ticketStats,
      customerStats,
      revenueStats,
      deviceStats,
      recentTickets,
      performanceData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Dashboard istatistikleri alınırken hata oluştu",
      error: error.message,
    });
  }
};
