import React, { useState, useEffect } from "react";
import { Tab, Row, Col, Card, Table, Button } from "react-bootstrap";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import * as reportService from "../../services/report.service";
import { Link } from "react-router-dom";

function TicketReports({ activeTab }) {
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month");

  useEffect(() => {
    if (activeTab) {
      fetchTicketStats(timeRange);
    }
  }, [activeTab, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    console.log("Time range changed to:", range);
    setTimeRange(range);
  };

  const fetchTicketStats = async (range) => {
    try {
      setLoading(true);
      console.log("Fetching ticket stats with range:", range);
      const data = await reportService.getTicketStats(range);
      console.log("Received ticket stats:", data);
      setTicketStats(data);
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tab.Pane eventKey="tickets">
      {/* Time Range Selector */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Zaman Aralığı</h5>
                </div>
                <div>
                  <Button variant={timeRange === "week" ? "primary" : "outline-primary"} className="me-2" onClick={() => handleTimeRangeChange("week")}>
                    Son Hafta
                  </Button>
                  <Button variant={timeRange === "month" ? "primary" : "outline-primary"} className="me-2" onClick={() => handleTimeRangeChange("month")}>
                    Son Ay
                  </Button>
                  <Button variant={timeRange === "year" ? "primary" : "outline-primary"} onClick={() => handleTimeRangeChange("year")}>
                    Son Yıl
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3">Bilet verileri yükleniyor...</p>
        </div>
      ) : ticketStats ? (
        <>
          {/* Summary Cards */}
          <Row className="g-4 mb-4">
            <Col xl={3} sm={6}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Toplam Biletler</h5>
                      <h2 className="mb-2">{ticketStats.totalTickets}</h2>
                      <p className="mb-0 text-muted">
                        <small>Son {timeRange === "week" ? "7" : timeRange === "month" ? "30" : "365"} günde</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-primary p-2">
                      <i className="fas fa-ticket-alt fs-3"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} sm={6}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Açık Biletler</h5>
                      <h2 className="mb-2">{ticketStats.openTickets}</h2>
                      <p className="mb-0 text-muted">
                        <small>Tüm zamanlar</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-warning p-2">
                      <i className="fas fa-clipboard-list fs-3"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} sm={6}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Tamamlanan</h5>
                      <h2 className="mb-2">{ticketStats.completedTickets}</h2>
                      <p className="mb-0 text-muted">
                        <small>Son {timeRange === "week" ? "7" : timeRange === "month" ? "30" : "365"} günde</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-success p-2">
                      <i className="fas fa-check-circle fs-3"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} sm={6}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Tamir Edilemedi</h5>
                      <h2 className="mb-2">{ticketStats.notRepairedTickets}</h2>
                      <p className="mb-0 text-muted">
                        <small>Son {timeRange === "week" ? "7" : timeRange === "month" ? "30" : "365"} günde</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-danger p-2">
                      <i className="fas fa-times-circle fs-3"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Ticket Charts */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Bilet Durumu Dağılımı</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Doughnut
                      data={{
                        labels: ["Beklemede", "Tamamlanan", "Tamir Edilemedi", "Beklemede Parça"],
                        datasets: [
                          {
                            data: [
                              ticketStats.statusDistribution.find((s) => s.ticket_status === "pending")?.count || 0,
                              ticketStats.statusDistribution.find((s) => s.ticket_status === "repaired")?.count || 0,
                              ticketStats.statusDistribution.find((s) => s.ticket_status === "not_repaired")?.count || 0,
                              ticketStats.statusDistribution.find((s) => s.ticket_status === "waiting_parts")?.count || 0,
                            ],
                            backgroundColor: [
                              "#ffab00", // Warning - Open
                              "#71dd37", // Success - Completed
                              "#ff3e1d", // Danger - Canceled
                              "#03c3ec", // Info - Pending
                            ],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "right",
                          },
                        },
                        cutout: "60%",
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Bilet Trendi</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Line
                      data={{
                        labels: ticketStats.ticketTrend?.map((entry) => entry.date),
                        datasets: [
                          {
                            label: "Oluşturulan Biletler",
                            data: ticketStats.ticketTrend?.map((entry) => entry.count),
                            borderColor: "#696cff",
                            backgroundColor: "rgba(105, 108, 255, 0.1)",
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: "#696cff",
                            pointBorderColor: "#fff",
                            pointBorderWidth: 2,
                            pointRadius: 4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0,
                            },
                          },
                          x: {
                            title: {
                              display: true,
                              text: `Son ${timeRange === "week" ? "Hafta" : timeRange === "month" ? "Ay" : "Yıl"} Verisi`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Ticket Details */}
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">En Uzun Çözüm Süreli Biletler</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Bilet #</th>
                        <th>Cihaz</th>
                        <th className="text-end">Çözüm Süresi (Gün)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketStats.longestResolutionTickets?.map((ticket, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                <i className="fas fa-ticket-alt text-primary"></i>
                              </div>
                              <Link to={`/tickets/${ticket.ticket_id}`} className="text-reset">
                                #{ticket.ticket_id}
                              </Link>
                            </div>
                          </td>
                          <td>{ticket.device_model}</td>
                          <td className="text-end fw-medium">{ticket.resolution_days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">İşlem Türlerine Göre Dağılım</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Bar
                      data={{
                        labels: ticketStats.operationDistribution?.map((op) => op.operation_name),
                        datasets: [
                          {
                            label: "İşlem Sayısı",
                            data: ticketStats.operationDistribution?.map((op) => op.count),
                            backgroundColor: "rgba(105, 108, 255, 0.8)",
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: "y",
                        scales: {
                          x: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0,
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div className="alert alert-warning">Bilet verileri bulunamadı.</div>
      )}
    </Tab.Pane>
  );
}

export default TicketReports;
