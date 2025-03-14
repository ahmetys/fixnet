import React, { useState, useEffect } from "react";
import { Tab, Row, Col, Card, Table } from "react-bootstrap";
import { Pie } from "react-chartjs-2";
import * as reportService from "../../services/report.service";
function CustomerReports({ activeTab }) {
  const [loading, setLoading] = useState(true);
  const [customerStats, setCustomerStats] = useState(null);

  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        const data = await reportService.getCustomerStats();
        setCustomerStats(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching customer stats:", error);
        setLoading(false);
      }
    };
    fetchCustomerStats();
  }, [activeTab]);

  return (
    <Tab.Pane eventKey="customers">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3">Müşteri verileri yükleniyor...</p>
        </div>
      ) : customerStats ? (
        <>
          {/* Customer Summary */}
          <Row className="g-4 mb-4">
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h1 className="display-4 mb-3 fw-bold text-primary">{customerStats.totalCustomers}</h1>
                  <h5 className="text-muted">Toplam Müşteri</h5>
                  <div className="mt-4">
                    <p className="mb-1">Son 30 günde kayıtlı müşteriler</p>
                    <div className="progress" style={{ height: "10px" }}>
                      <div className="progress-bar" role="progressbar" style={{ width: "75%" }} aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Müşteri Türü Dağılımı</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div style={{ height: "250px" }}>
                        <Pie
                          data={{
                            labels: customerStats.typeDistribution.map((type) => (type.customer_type === "commercial" ? "Kurumsal" : "Bireysel")),
                            datasets: [
                              {
                                data: customerStats.typeDistribution.map((type) => type.count),
                                backgroundColor: ["#696cff", "#03c3ec"],
                                borderWidth: 0,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "bottom",
                              },
                            },
                          }}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3">
                        <h6 className="mb-3">Müşteri Türü Özeti</h6>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span>Bireysel</span>
                            <span className="fw-bold">{customerStats.typeDistribution.find((t) => t.customer_type === "individual")?.count || 0}</span>
                          </div>
                          <div className="progress" style={{ height: "8px" }}>
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{
                                width: `${(customerStats.typeDistribution.find((t) => t.customer_type === "individual")?.count / customerStats.totalCustomers) * 100 || 0}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span>Kurumsal</span>
                            <span className="fw-bold">{customerStats.typeDistribution.find((t) => t.customer_type === "commercial")?.count || 0}</span>
                          </div>
                          <div className="progress" style={{ height: "8px" }}>
                            <div
                              className="progress-bar bg-info"
                              role="progressbar"
                              style={{
                                width: `${(customerStats.typeDistribution.find((t) => t.customer_type === "commercial")?.count / customerStats.totalCustomers) * 100 || 0}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="mt-4 text-center">
                          <div className="d-flex justify-content-between">
                            <div>
                              <h5 className="mb-0">{Math.round((customerStats.typeDistribution.find((t) => t.customer_type === "individual")?.count / customerStats.totalCustomers) * 100 || 0)}%</h5>
                              <small className="text-muted">Bireysel</small>
                            </div>
                            <div>
                              <h5 className="mb-0">{Math.round((customerStats.typeDistribution.find((t) => t.customer_type === "commercial")?.count / customerStats.totalCustomers) * 100 || 0)}%</h5>
                              <small className="text-muted">Kurumsal</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Top Customers */}
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">En Çok Bilet Sahibi Müşteriler</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Müşteri Adı</th>
                        <th>Türü</th>
                        <th className="text-end">Bilet Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerStats.topCustomersByTickets.slice(0, 5).map((customer, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`me-2 bg-${customer.customer_type === "commercial" ? "info" : "primary"} text-white rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "32px", height: "32px" }}>
                                <i className={`fas fa-${customer.customer_type === "commercial" ? "building" : "user"}`}></i>
                              </div>
                              <div>
                                <p className="mb-0 fw-medium">{customer.customer_name}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge bg-label-${customer.customer_type === "commercial" ? "info" : "primary"}`}>{customer.customer_type === "commercial" ? "Kurumsal" : "Bireysel"}</span>
                          </td>
                          <td className="text-end fw-medium">{customer.ticket_count}</td>
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
                  <h5 className="mb-0">En Çok Harcama Yapan Müşteriler</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Müşteri Adı</th>
                        <th>Türü</th>
                        <th className="text-end">Toplam Harcama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerStats.topCustomersBySpending.slice(0, 5).map((customer, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`me-2 bg-${customer.customer_type === "commercial" ? "info" : "primary"} text-white rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "32px", height: "32px" }}>
                                <i className={`fas fa-${customer.customer_type === "commercial" ? "building" : "user"}`}></i>
                              </div>
                              <div>
                                <p className="mb-0 fw-medium">{customer.customer_name}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge bg-label-${customer.customer_type === "commercial" ? "info" : "primary"}`}>{customer.customer_type === "commercial" ? "Kurumsal" : "Bireysel"}</span>
                          </td>
                          <td className="text-end fw-medium">{customer.total_spent}</td>
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
        <div className="alert alert-warning">Müşteri verileri bulunamadı.</div>
      )}
    </Tab.Pane>
  );
}

export default CustomerReports;
