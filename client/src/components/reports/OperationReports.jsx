import React, { useState, useEffect } from "react";
import { Tab, Row, Col, Card, Table, Button } from "react-bootstrap";
import { Bar, Line, Pie } from "react-chartjs-2";
import * as reportService from "../../services/report.service";

function OperationReports({ activeTab }) {
  const [loading, setLoading] = useState(true);
  const [operationStats, setOperationStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month");

  useEffect(() => {
    if (activeTab) {
      fetchOperationStats(timeRange);
    }
  }, [activeTab, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    console.log("Operation time range changed to:", range);
    setTimeRange(range);
  };

  const fetchOperationStats = async (range) => {
    try {
      setLoading(true);
      console.log("Fetching operation stats with range:", range);
      const data = await reportService.getOperationStats(range);
      console.log("Received operation stats:", data);
      setOperationStats(data);
    } catch (error) {
      console.error("Error fetching operation stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(amount);
  };

  return (
    <Tab.Pane eventKey="operations">
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
          <p className="mt-3">İşlem verileri yükleniyor...</p>
        </div>
      ) : operationStats ? (
        <>
          {/* Summary Cards */}
          <Row className="g-4 mb-4">
            <Col xl={3} sm={6}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Toplam İşlemler</h5>
                      <h2 className="mb-2">{operationStats.mostCommonOperations?.reduce((sum, op) => sum + op.count, 0) || 0}</h2>
                      <p className="mb-0 text-muted">
                        <small>Son {timeRange === "week" ? "7" : timeRange === "month" ? "30" : "365"} günde</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-primary p-2">
                      <i className="fas fa-cogs fs-3"></i>
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
                      <h5 className="mb-1">Ortalama İşlem/Bilet</h5>
                      <h2 className="mb-2">{operationStats.operationsPerTicket?.toFixed(1) || "0.0"}</h2>
                      <p className="mb-0 text-muted">
                        <small>Bilet başına işlem sayısı</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-info p-2">
                      <i className="fas fa-chart-line fs-3"></i>
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
                      <h5 className="mb-1">Toplam Gelir</h5>
                      <h2 className="mb-2">{formatCurrency(operationStats.totalRevenue || 0)}</h2>
                      <p className="mb-0 text-muted">
                        <small>İşlemlerden elde edilen</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-success p-2">
                      <i className="fas fa-money-bill-wave fs-3"></i>
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
                      <h5 className="mb-1">Ortalama İşlem Bedeli</h5>
                      <h2 className="mb-2">{formatCurrency(operationStats.averageOperationPrice || 0)}</h2>
                      <p className="mb-0 text-muted">
                        <small>İşlem başına ücret</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-warning p-2">
                      <i className="fas fa-tags fs-3"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Operation Charts */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">En Sık Gerçekleştirilen İşlemler</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Bar
                      data={{
                        labels: operationStats.mostCommonOperations?.map((op) => op.operation_name) || [],
                        datasets: [
                          {
                            label: "İşlem Sayısı",
                            data: operationStats.mostCommonOperations?.map((op) => op.count) || [],
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

            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">İşlem Trendleri</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Line
                      data={{
                        labels: operationStats.operationTrend?.map((entry) => entry.date) || [],
                        datasets: [
                          {
                            label: "İşlem Sayısı",
                            data: operationStats.operationTrend?.map((entry) => entry.count) || [],
                            borderColor: "#696cff",
                            backgroundColor: "rgba(105, 108, 255, 0.1)",
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: "#696cff",
                            pointBorderColor: "#fff",
                            pointBorderWidth: 2,
                            pointRadius: 3,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            position: "left",
                            title: {
                              display: true,
                              text: "İşlem Sayısı",
                            },
                            ticks: {
                              precision: 0,
                            },
                          },
                        },
                        plugins: {
                          title: {
                            display: true,
                            text: `Son ${timeRange === "week" ? "Hafta" : timeRange === "month" ? "Ay" : "Yıl"} Verisi`,
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

          {/* Operation Details */}
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">En Yüksek Gelirli İşlemler</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>İşlem</th>
                        <th className="text-end">Toplam Gelir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operationStats.highestRevenueOperations?.map((op, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                <i className="fas fa-tools text-primary"></i>
                              </div>
                              <span>{op.operation_name}</span>
                            </div>
                          </td>
                          <td className="text-end fw-medium">{formatCurrency(op.revenue)}</td>
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
                  <h5 className="mb-0">Cihaz Türlerine Göre İşlemler</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Cihaz Türü</th>
                        <th>En Sık İşlem</th>
                        <th className="text-end">İşlem Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operationStats.operationsByDeviceType
                        ?.reduce((acc, curr) => {
                          // Group by device_type_name
                          const existing = acc.find((x) => x.device_type_name === curr.device_type_name);
                          if (existing) {
                            // If this operation count is higher than what we already stored
                            if (curr.count > existing.count) {
                              existing.operation_name = curr.operation_name;
                              existing.count = curr.count;
                            }
                          } else {
                            acc.push({
                              device_type_name: curr.device_type_name,
                              operation_name: curr.operation_name,
                              count: curr.count,
                            });
                          }
                          return acc;
                        }, [])
                        .map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                  <i className="fas fa-mobile-alt text-primary"></i>
                                </div>
                                <span>{item.device_type_name}</span>
                              </div>
                            </td>
                            <td>{item.operation_name}</td>
                            <td className="text-end fw-medium">{item.count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div className="alert alert-warning">İşlem verileri bulunamadı.</div>
      )}
    </Tab.Pane>
  );
}

export default OperationReports;
