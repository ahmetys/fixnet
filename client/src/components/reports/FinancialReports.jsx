import React, { useState, useEffect } from "react";
import { Tab, Row, Col, Card, Table, Button } from "react-bootstrap";
import { Line, Bar } from "react-chartjs-2";
import * as reportService from "../../services/report.service";
import { Link } from "react-router-dom";

function FinancialReports({ activeTab }) {
  const [loading, setLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab) {
      fetchFinancialStats(timeRange);
    }
  }, [activeTab, timeRange]);

  const fetchFinancialStats = async (range) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching financial stats with range:", range);
      const data = await reportService.getFinancialStats(range);
      console.log("Received financial stats:", data);

      // Veri formatı dönüşümleri
      if (data && data.revenueOverTime) {
        // Gelirleri string formatından number formatına dönüştürelim
        data.revenueOverTime = data.revenueOverTime.map((entry) => ({
          ...entry,
          revenue: parseFloat(entry.revenue || 0),
          ticket_count: parseInt(entry.ticket_count || 0, 10),
          // Tarih formatını düzenle
          date: entry.date ? new Date(entry.date).toISOString().split("T")[0] : entry.date,
        }));
      }

      // Eğer toplam değerler string olarak geliyorsa, bunları da düzeltelim
      if (data) {
        data.totalRevenue = parseFloat(data.totalRevenue || 0);
        data.highestTicketValue = parseFloat(data.highestTicketValue || 0);
        data.averageTicketValue = parseFloat(data.averageTicketValue || 0);
        data.totalTickets = parseInt(data.totalTickets || 0, 10);
      }

      setFinancialStats(data);
    } catch (error) {
      console.error("Error fetching financial stats:", error);
      setError("Finansal veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(amount);
  };

  const handleTimeRangeChange = (range) => {
    console.log("Financial time range changed to:", range);
    setTimeRange(range);
  };

  const exportReport = async (reportType, format, timeRangeValue) => {
    try {
      if (reportType === "financial") {
        const data = await reportService.getFinancialStats(timeRangeValue, { format });
        if (data && data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
        alert(`Rapor ${format.toUpperCase()} formatında başarıyla indirildi.`);
      } else {
        alert("Bu rapor türü için dışa aktarma henüz desteklenmiyor.");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Rapor dışa aktarılırken bir hata oluştu.");
    }
  };

  return (
    <Tab.Pane eventKey="financials">
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

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3">Finansal veriler yükleniyor...</p>
        </div>
      ) : financialStats ? (
        <>
          {/* Summary Cards */}
          <Row className="g-4 mb-4">
            <Col xl={3} sm={6}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="mb-1">Toplam Gelir</h5>
                      <h2 className="mb-2">{formatCurrency(financialStats.totalRevenue || 0)}</h2>
                      <p className="mb-0 text-success">
                        <i className="fas fa-arrow-up me-1"></i>
                        <span>{financialStats.revenueChange || 0}%</span>
                        <small className="ms-1 text-muted">önceki döneme göre</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-primary p-2">
                      <i className="fas fa-hand-holding-usd fs-3"></i>
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
                      <h5 className="mb-1">Toplam Bilet</h5>
                      <h2 className="mb-2">{financialStats.totalTickets || 0}</h2>
                      <p className={`mb-0 text-${(financialStats.ticketChange || 0) >= 0 ? "success" : "danger"}`}>
                        <i className={`fas fa-arrow-${(financialStats.ticketChange || 0) >= 0 ? "up" : "down"} me-1`}></i>
                        <span>{Math.abs(financialStats.ticketChange || 0)}%</span>
                        <small className="ms-1 text-muted">önceki döneme göre</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-info p-2">
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
                      <h5 className="mb-1">Ortalama Bilet Değeri</h5>
                      <h2 className="mb-2">{formatCurrency(financialStats.averageTicketValue || 0)}</h2>
                      <p className={`mb-0 text-${(financialStats.avgTicketValueChange || 0) >= 0 ? "success" : "danger"}`}>
                        <i className={`fas fa-arrow-${(financialStats.avgTicketValueChange || 0) >= 0 ? "up" : "down"} me-1`}></i>
                        <span>{Math.abs(financialStats.avgTicketValueChange || 0)}%</span>
                        <small className="ms-1 text-muted">önceki döneme göre</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-warning p-2">
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
                      <h5 className="mb-1">En Yüksek Bilet</h5>
                      <h2 className="mb-2">{formatCurrency(financialStats.highestTicketValue || 0)}</h2>
                      <p className="mb-0 text-muted">
                        <small>Bilet #{financialStats.highestTicketId || "N/A"}</small>
                      </p>
                    </div>
                    <div className="avatar avatar-lg bg-label-success p-2">
                      <i className="fas fa-trophy fs-3"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Revenue Chart */}
          <Row className="g-4 mb-4">
            <Col md={12}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Gelir Trendi</h5>
                  <div>
                    <span className="badge bg-primary me-2">{timeRange === "week" ? "Son Hafta" : timeRange === "month" ? "Son Ay" : "Son Yıl"}</span>
                    <Button variant="outline-primary" size="sm" onClick={() => exportReport("financial", "pdf", timeRange)}>
                      <i className="fas fa-file-pdf me-1"></i> PDF
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    {financialStats.revenueOverTime && financialStats.revenueOverTime.length > 0 ? (
                      financialStats.revenueOverTime.every((entry) => parseFloat(entry.revenue || 0) === 0) ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                          <i className="fas fa-chart-line text-muted mb-3" style={{ fontSize: "2.5rem" }}></i>
                          <p className="text-muted mb-0">Bu zaman aralığında herhangi bir gelir kaydı bulunmamaktadır.</p>
                          <p className="text-muted small mt-2">Not: Sistem verilerinde {timeRange === "week" ? "son hafta" : timeRange === "month" ? "son ay" : "son yıl"} içinde tamamlanmış bilet bulunmadığı için grafik boş görünmektedir.</p>
                        </div>
                      ) : (
                        <Line
                          data={{
                            labels: financialStats.revenueOverTime.map((entry) => {
                              if (entry.date) {
                                const date = new Date(entry.date);
                                return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                              }
                              return entry.date || (entry.year && entry.month ? `${entry.year}-${entry.month}` : entry.week ? `Hafta ${entry.week}` : "");
                            }),
                            datasets: [
                              {
                                label: "Gelir",
                                data: financialStats.revenueOverTime.map((entry) => parseFloat(entry.revenue || 0)),
                                borderColor: "#696cff",
                                backgroundColor: "rgba(105, 108, 255, 0.1)",
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: "#696cff",
                                pointBorderColor: "#fff",
                                pointBorderWidth: 2,
                                pointRadius: 4,
                              },
                              financialStats.revenueOverTime[0]?.ticket_count && {
                                label: "Bilet Sayısı",
                                data: financialStats.revenueOverTime.map((entry) => parseInt(entry.ticket_count || 0, 10)),
                                borderColor: "#03c3ec",
                                backgroundColor: "rgba(3, 195, 236, 0.1)",
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: "#03c3ec",
                                pointBorderColor: "#fff",
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                yAxisID: "y1",
                              },
                            ].filter(Boolean),
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: "Gelir (₺)",
                                },
                              },
                              ...(financialStats.revenueOverTime[0]?.ticket_count && {
                                y1: {
                                  beginAtZero: true,
                                  position: "right",
                                  title: {
                                    display: true,
                                    text: "Bilet Sayısı",
                                  },
                                  grid: {
                                    drawOnChartArea: false,
                                  },
                                },
                              }),
                            },
                          }}
                        />
                      )
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <p className="text-muted mb-0">Bu zaman aralığında veri bulunmamaktadır.</p>
                      </div>
                    )}
                  </div>

                  {/* Ekstra bilgi ve yardım metni */}
                  {financialStats.revenueOverTime && financialStats.revenueOverTime.length > 0 && financialStats.revenueOverTime.every((entry) => parseFloat(entry.revenue || 0) === 0) && (
                    <div className="mt-3 alert alert-info">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-info-circle me-2"></i>
                        <div>
                          <p className="mb-1">
                            <strong>Grafik neden boş görünüyor?</strong>
                          </p>
                          <p className="mb-0 small">
                            {timeRange === "week" ? "Son bir hafta" : timeRange === "month" ? "Son bir ay" : "Son bir yıl"} içerisinde tamamlanmış ve ödemesi alınmış bilet kaydı olmadığı için gelir grafiği boş görünmektedir. Veriler, biletler teslim edildiğinde ve ödemeleri tamamlandığında otomatik
                            olarak güncellenecektir.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Financial Details */}
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">En Yüksek Gelirli Müşteriler</h5>
                </Card.Header>
                <Card.Body>
                  {financialStats.topCustomersByRevenue && financialStats.topCustomersByRevenue.length > 0 ? (
                    <Table responsive hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Müşteri</th>
                          <th className="text-end">Toplam Harcama</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialStats.topCustomersByRevenue.map((customer, index) => (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar me-2">
                                  <div className="avatar-initial rounded-circle bg-label-primary">{(customer.customer_name || "").charAt(0)}</div>
                                </div>
                                <div>
                                  <Link to={`/customers/${customer.customer_id || "#"}`} className="text-body fw-medium">
                                    {customer.customer_name || "İsimsiz Müşteri"}
                                  </Link>
                                  <p className="text-muted mb-0">{customer.customer_type === "individual" ? "Bireysel" : "Kurumsal"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-end fw-medium">{formatCurrency(customer.revenue || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted mb-0">Henüz müşteri verisi bulunmamaktadır.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Cihaz Markalarına Göre Gelir</h5>
                </Card.Header>
                <Card.Body>
                  {financialStats.revenueByDeviceBrand && financialStats.revenueByDeviceBrand.length > 0 ? (
                    <div style={{ height: "300px" }}>
                      <Bar
                        data={{
                          labels: financialStats.revenueByDeviceBrand.map((brand) => brand.device_brand_name || "Bilinmeyen"),
                          datasets: [
                            {
                              label: "Gelir",
                              data: financialStats.revenueByDeviceBrand.map((brand) => brand.revenue || 0),
                              backgroundColor: "rgba(105, 108, 255, 0.8)",
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "Gelir (₺)",
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
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <p className="text-muted mb-0">Henüz cihaz markası verisi bulunmamaktadır.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div className="alert alert-warning">Finansal veriler bulunamadı.</div>
      )}
    </Tab.Pane>
  );
}

export default FinancialReports;
