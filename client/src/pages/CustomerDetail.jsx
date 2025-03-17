import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import * as customerService from "../services/customer.service";
import * as ticketService from "../services/ticket.service";
import { useNotification } from "../contexts/NotificationContext";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleApiError } = useNotification();

  const [customer, setCustomer] = useState(null);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date for display (show only day, month, year)
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper function for status badge color
  const getStatusBadgeColor = (status) => {
    if (!status) return "secondary";

    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "waiting_parts":
        return "info";
      case "repaired":
        return "success";
      case "not_repaired":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Format status text for display - Convert to Turkish
  const formatStatusText = (status) => {
    if (!status) return "Beklemede";

    // Türkçe çeviriler
    switch (status.toLowerCase()) {
      case "pending":
        return "Beklemede";
      case "waiting_parts":
        return "Parça Bekleniyor";
      case "repaired":
        return "Onarıldı";
      case "not_repaired":
        return "Onarılamadı";
      case "delivered":
        return "Teslim Edildi";
      default:
        // Bilinmeyen durumlar için genel formatlama
        return status
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
    }
  };

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);

        // Fetch customer details
        const customerData = await customerService.getCustomerById(id);
        setCustomer(customerData);

        // Fetch customer tickets
        const ticketsData = await ticketService.getTicketsByCustomerId(id);
        setCustomerTickets(ticketsData);
        setError(null);
      } catch (err) {
        setError("Müşteri verisi yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCustomerData();
    }
  }, [id, handleApiError]);

  // Handle ticket row click
  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  // If loading, show spinner
  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3">Müşteri verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <div className="text-center mt-3">
          <button className="btn btn-primary" onClick={() => navigate("/customers")}>
            Müşterilere Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // If customer not found
  if (!customer) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning" role="alert">
          Müşteri bulunamadı veya silinmiş.
        </div>
        <div className="text-center mt-3">
          <button className="btn btn-primary" onClick={() => navigate("/customers")}>
            Müşterilere Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header with back button */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-transparent shadow-none border-0">
            <div className="card-body p-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <h4 className="fw-bold py-3 mb-0">Müşteri Detayları</h4>
              </div>
              <div>
                <Link to={`/customers`} className="btn btn-outline-secondary">
                  <i className="bx bx-arrow-back me-1"></i> Müşterilere Geri Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer information card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Müşteri Bilgileri</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">İsim</span>
                    <span className="fs-5">{customer.customer_name}</span>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Telefon</span>
                    <span className="fs-5">{customer.customer_phone}</span>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Email</span>
                    <span className="fs-5">{customer.customer_email || "Belirtilmemiş"}</span>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Eklenme Tarihi</span>
                    <span className="fs-5">{formatDate(customer.created_at)}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Adres</span>
                    <span className="fs-5">{customer.customer_address || "Belirtilmemiş"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer tickets card */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Müşteri Servis Fişleri</h5>
              <span className="badge bg-primary rounded-pill">{customerTickets.length} fiş</span>
            </div>
            <div className="card-datatable table-responsive">
              <div className="table-responsive text-nowrap">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cihaz</th>
                      <th>Durum</th>
                      <th>Oluşturulma</th>
                      <th>Notlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTickets.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="p-2">
                            <i className="bx bx-info-circle text-primary fs-3 mb-2"></i>
                            <p>Bu müşteri için servis fişi bulunamadı.</p>
                            <Link to={`/tickets/add?customerId=${id}`} className="btn btn-sm btn-primary">
                              İlk Servis Fişini Oluştur
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      customerTickets.map((ticket) => (
                        <tr key={ticket.ticket_id} style={{ cursor: "pointer" }} onClick={() => handleTicketClick(ticket.ticket_id)}>
                          <td>#{ticket.ticket_id}</td>
                          <td>{ticket.device_model_name || ticket.device_name || "Belirtilmemiş"}</td>
                          <td>
                            <div className="d-flex gap-1 align-items-center">
                              <span className={`badge bg-${getStatusBadgeColor(ticket.ticket_status)}`}>{formatStatusText(ticket.ticket_status)}</span>
                              {ticket.ticket_delivered && <span className="badge bg-primary">Teslim Edildi</span>}
                            </div>
                          </td>
                          <td>{formatDate(ticket.created_at)}</td>
                          <td>
                            {ticket.ticket_notes?.substring(0, 50) || "Belirtilmemiş"}
                            {ticket.ticket_notes?.length > 50 ? "..." : ""}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
