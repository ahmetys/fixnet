import React, { useState, useEffect } from "react";
import { Tab, Row, Col, Card, Table } from "react-bootstrap";
import { Pie, Bar } from "react-chartjs-2";
import * as reportService from "../../services/report.service";

export default function DeviceReports({ activeTab }) {
  const [loading, setLoading] = useState(true);
  const [deviceStats, setDeviceStats] = useState(null);

  useEffect(() => {
    const fetchDeviceStats = async () => {
      try {
        const data = await reportService.getDeviceStats();
        setDeviceStats(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching device stats:", error);
        setLoading(false);
      }
    };
    fetchDeviceStats();
  }, [activeTab]);
  return (
    <Tab.Pane eventKey="devices">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3">Cihaz verileri yükleniyor...</p>
        </div>
      ) : deviceStats ? (
        <>
          {/* Brand Distribution */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Marka Dağılımı</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Bar
                      data={{
                        labels: deviceStats.brandDistribution.map((brand) => brand.device_brand_name),
                        datasets: [
                          {
                            label: "Bilet Sayısı",
                            data: deviceStats.brandDistribution.map((brand) => brand.ticket_count),
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
                <Card.Header>
                  <h5 className="mb-0">Tür Dağılımı</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Pie
                      data={{
                        labels: deviceStats.typeDistribution.map((type) => type.device_type_name),
                        datasets: [
                          {
                            data: deviceStats.typeDistribution.map((type) => type.ticket_count),
                            backgroundColor: [
                              "#696cff", // Primary
                              "#03c3ec", // Info
                              "#71dd37", // Success
                              "#ffab00", // Warning
                              "#8592a3", // Secondary
                              "#ff3e1d", // Danger
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
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Models and Hierarchy */}
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">En Çok Tamir Edilen Modeller</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Model</th>
                        <th className="text-end">Bilet Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceStats.modelDistribution.map((model, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                <i className="fas fa-mobile-alt text-primary"></i>
                              </div>
                              <div>
                                <p className="mb-0 fw-medium">{model.device_model_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end align-items-center">
                              <span className="me-2">{model.ticket_count}</span>
                              <div className="progress flex-grow-1" style={{ height: "8px", maxWidth: "100px" }}>
                                <div
                                  className="progress-bar bg-primary"
                                  role="progressbar"
                                  style={{
                                    width: `${(model.ticket_count / Math.max(...deviceStats.modelDistribution.map((m) => m.ticket_count))) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
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
                  <h5 className="mb-0">Marka ve Tür Hiyerarşisi</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Marka</th>
                        <th>Tür</th>
                        <th className="text-end">Bilet Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceStats.brandTypeHierarchy.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="rounded bg-light p-1 me-2">
                                <i className="fas fa-building text-primary"></i>
                              </div>
                              <span>{item.device_brand_name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="rounded bg-light p-1 me-2">
                                <i className="fas fa-tag text-info"></i>
                              </div>
                              <span>{item.device_type_name}</span>
                            </div>
                          </td>
                          <td className="text-end fw-medium">{item.ticket_count}</td>
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
        <div className="alert alert-warning">Cihaz verileri bulunamadı.</div>
      )}
    </Tab.Pane>
  );
}
