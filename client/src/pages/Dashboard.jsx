import { useState, useEffect } from "react";
// import axios from "axios"; // Bu satırı kaldırıyorum
import { Card, Row, Col, Badge, Table, Spinner, Alert } from "react-bootstrap";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { FaTicketAlt, FaUsers, FaMoneyBillWave, FaMobileAlt, FaClock } from "react-icons/fa";
import { getDashboardData } from "../services/dashboard.service";
// ChartJS kayıt
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  // const { showError, showSuccess } = useNotification();
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        console.error("Dashboard verileri alınırken hata:", err);
        setError("İstatistikler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        // showError("Dashboard verileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // 5 dakikada bir verileri güncelle
    const interval = setInterval(fetchDashboardData, 300000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // Renk paleti
  const colors = {
    primary: "#7367f0",
    success: "#28c76f",
    danger: "#ea5455",
    warning: "#ff9f43",
    info: "#00cfe8",
    secondary: "#82868b",
    dark: "#4b4b4b",
    light: "#f8f8f8",
    chartColors: ["#7367f0", "#28c76f", "#ea5455", "#ff9f43", "#00cfe8", "#82868b"],
  };

  // Bilet durumu renkleri
  const statusColors = {
    pending: "warning",
    waiting_parts: "info",
    repaired: "success",
    not_repaired: "danger",
  };

  // Status açıklamaları
  const statusLabels = {
    pending: "Bekliyor",
    waiting_parts: "İşlemde",
    repaired: "Tamir Edildi",
    not_repaired: "Tamir Edilemez",
  };

  // Gelir trendi grafiği için veri
  const revenueChartData = {
    labels: dashboardData.revenueStats.trend.map((item) => item.month),
    datasets: [
      {
        label: "Gelir",
        data: dashboardData.revenueStats.trend.map((item) => item.total),
        borderColor: colors.primary,
        backgroundColor: "rgba(115, 103, 240, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Bilet durumu dağılımı için veri
  const ticketStatusData = {
    labels: dashboardData.ticketStats.byStatus.map((item) => statusLabels[item.ticket_status]),
    datasets: [
      {
        data: dashboardData.ticketStats.byStatus.map((item) => item.count),
        backgroundColor: dashboardData.ticketStats.byStatus.map((item) => colors[statusColors[item.ticket_status]]),
        borderWidth: 0,
      },
    ],
  };

  // Cihaz türü dağılımı için veri
  const deviceTypeData = {
    labels: dashboardData.deviceStats.byType.map((item) => item.device_type_name),
    datasets: [
      {
        label: "Cihaz Türleri",
        data: dashboardData.deviceStats.byType.map((item) => item.count),
        backgroundColor: colors.chartColors.slice(0, dashboardData.deviceStats.byType.length),
      },
    ],
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <h4 className="fw-bold py-3 mb-4">Dashboard</h4>

      {/* Özet Kartlar */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="avatar avatar-stats bg-light-primary">
                  <span className="avatar-initial rounded">
                    <FaTicketAlt size={24} color={colors.primary} />
                  </span>
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">{dashboardData.ticketStats.total}</h5>
                  <small>Toplam Bilet</small>
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="light-primary" text="primary" className="me-2">
                  +{dashboardData.ticketStats.today}
                </Badge>
                <small>Bugün</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="avatar avatar-stats bg-light-success">
                  <span className="avatar-initial rounded">
                    <FaUsers size={24} color={colors.success} />
                  </span>
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">{dashboardData.customerStats.total}</h5>
                  <small>Müşteriler</small>
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="light-success" text="success" className="me-2">
                  +{dashboardData.customerStats.new}
                </Badge>
                <small>Bu ay</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="avatar avatar-stats bg-light-warning">
                  <span className="avatar-initial rounded">
                    <FaMoneyBillWave size={24} color={colors.warning} />
                  </span>
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">₺{dashboardData.revenueStats.total.toLocaleString()}</h5>
                  <small>Toplam Gelir</small>
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="light-warning" text="warning" className="me-2">
                  ₺{dashboardData.revenueStats.monthly.toLocaleString()}
                </Badge>
                <small>Bu ay</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="avatar avatar-stats bg-light-info">
                  <span className="avatar-initial rounded">
                    <FaClock size={24} color={colors.info} />
                  </span>
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">{Math.round(dashboardData.performanceData.avgRepairTime)} gün</h5>
                  <small>Ort. Tamir Süresi</small>
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="light-info" text="info" className="me-2">
                  {dashboardData.ticketStats.pending}
                </Badge>
                <small>Bekleyen İşlem</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Grafikler */}
      <Row className="mb-4">
        {/* Gelir Trendi */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0">Gelir Trendi</h5>
            </Card.Header>
            <Card.Body>
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `₺${value}`,
                      },
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => `Gelir: ₺${context.raw}`,
                      },
                    },
                  },
                }}
                height={300}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Bilet Durumu */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0">Bilet Durumu</h5>
            </Card.Header>
            <Card.Body className="d-flex justify-content-center">
              <div style={{ height: 300, width: "100%", maxWidth: 300 }}>
                <Doughnut
                  data={ticketStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        {/* Cihaz Türleri */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0">Cihaz Türleri</h5>
            </Card.Header>
            <Card.Body>
              <Bar
                data={deviceTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y",
                  scales: {
                    x: {
                      beginAtZero: true,
                    },
                  },
                }}
                height={300}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Son Biletler */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0">Son Biletler</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover responsive className="table-borderless">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Müşteri</th>
                      <th>Cihaz</th>
                      <th>Durum</th>
                      <th>Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {dashboardData.recentTickets.map((ticket) => (
                      <tr key={ticket.ticket_id}>
                        <td>
                          <strong>{ticket.ticket_no}</strong>
                        </td>
                        <td>{ticket.customer_name}</td>
                        <td>
                          <small className="text-truncate">
                            {ticket.device_brand_name} {ticket.device_type_name} {ticket.device_model_name || ""}
                          </small>
                        </td>
                        <td>
                          <Badge bg={statusColors[ticket.ticket_status]}>{statusLabels[ticket.ticket_status]}</Badge>
                        </td>
                        <td>
                          <small>{new Date(ticket.created_at).toLocaleDateString("tr-TR")}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
