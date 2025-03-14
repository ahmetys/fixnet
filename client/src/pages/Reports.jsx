import React, { useState } from "react";
import { Container, Row, Col, Nav, Tab } from "react-bootstrap";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
import "react-datepicker/dist/react-datepicker.css";
import PageHeader from "../components/PageHeader";
import CustomerReports from "../components/reports/CustomerReports";
import DeviceReports from "../components/reports/DeviceReports";
import TicketReports from "../components/reports/TicketReports";
import OperationReports from "../components/reports/OperationReports";
import FinancialReports from "../components/reports/FinancialReports";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const Reports = () => {
  const [activeTab, setActiveTab] = useState("customers");

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Container fluid className="p-4">
      <PageHeader title="Raporlar" subtitle="Servis işletmenizin performansını detaylı raporlarla takip edin" icon="chart-bar" />

      <Tab.Container id="report-tabs" activeKey={activeTab} onSelect={handleTabChange}>
        <Row className="mb-4">
          <Col>
            <Nav variant="tabs" className="nav-fill">
              <Nav.Item>
                <Nav.Link eventKey="customers">
                  <i className="fas fa-users me-2"></i>
                  Müşteriler
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="devices">
                  <i className="fas fa-mobile-alt me-2"></i>
                  Cihazlar
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="tickets">
                  <i className="fas fa-ticket-alt me-2"></i>
                  Biletler
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="operations">
                  <i className="fas fa-tools me-2"></i>
                  Operasyonlar
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="financials">
                  <i className="fas fa-money-bill-wave me-2"></i>
                  Finansal
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        {/* Tab Content */}
        <Tab.Content>
          <CustomerReports activeTab={activeTab === "customers"} />
          <DeviceReports activeTab={activeTab === "devices"} />
          <TicketReports activeTab={activeTab === "tickets"} />
          <OperationReports activeTab={activeTab === "operations"} />
          <FinancialReports activeTab={activeTab === "financials"} />
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default Reports;
