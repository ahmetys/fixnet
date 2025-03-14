import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import * as customerService from "../services/customer.service";
import * as ticketService from "../services/ticket.service";
import { useNotification } from "../hooks/useNotification";

const CustomerDetail = () => {
  const { id } = useParams();
  console.log(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

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
      case "completed":
      case "repaired":
      case "delivered":
        return "success";
      case "cancelled":
      case "not_repaired":
        return "danger";
      case "in progress":
        return "info";
      case "on the way":
        return "primary";
      default:
        return "secondary";
    }
  };

  // Format status text for display (convert "waiting_parts" to "Waiting Parts")
  const formatStatusText = (status) => {
    if (!status) return "Pending";

    // Replace underscores with spaces and capitalize each word
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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
        console.error("Error fetching customer data:", err);
        setError("Failed to load customer data. Please try again later.");
        showError("Failed to load customer data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCustomerData();
    }
  }, [id, showError]);

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
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading customer data...</p>
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
            Back to Customers
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
          Customer not found or has been deleted.
        </div>
        <div className="text-center mt-3">
          <button className="btn btn-primary" onClick={() => navigate("/customers")}>
            Back to Customers
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
                <button className="btn btn-icon btn-outline-secondary me-2" onClick={() => navigate("/customers")}>
                  <i className="bx bx-arrow-back"></i>
                </button>
                <h4 className="fw-bold py-3 mb-0">Customer Details</h4>
              </div>
              <div>
                <Link to={`/customers/edit/${id}`} className="btn btn-primary me-2">
                  <i className="bx bx-edit me-1"></i> Edit Customer
                </Link>
                <Link to={`/tickets/add?customerId=${id}`} className="btn btn-success">
                  <i className="bx bx-plus me-1"></i> New Ticket
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
              <h5 className="card-title mb-0">Customer Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Name</span>
                    <span className="fs-5">{customer.customer_name}</span>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Phone</span>
                    <span className="fs-5">{customer.customer_phone}</span>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Email</span>
                    <span className="fs-5">{customer.customer_email || "N/A"}</span>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Added On</span>
                    <span className="fs-5">{formatDate(customer.created_at)}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex flex-column">
                    <span className="text-muted small">Address</span>
                    <span className="fs-5">{customer.customer_address || "N/A"}</span>
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
              <h5 className="card-title mb-0">Customer Tickets</h5>
              <span className="badge bg-primary rounded-pill">{customerTickets.length} tickets</span>
            </div>
            <div className="card-datatable table-responsive">
              <div className="table-responsive text-nowrap">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Device</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTickets.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="p-2">
                            <i className="bx bx-info-circle text-primary fs-3 mb-2"></i>
                            <p>No tickets found for this customer.</p>
                            <Link to={`/tickets/add?customerId=${id}`} className="btn btn-sm btn-primary">
                              Create First Ticket
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      customerTickets.map((ticket) => (
                        <tr key={ticket.ticket_id} style={{ cursor: "pointer" }} onClick={() => handleTicketClick(ticket.ticket_id)}>
                          <td>#{ticket.ticket_id}</td>
                          <td>{ticket.device_model_name || ticket.device_name || "N/A"}</td>
                          <td>
                            <span className={`badge bg-${getStatusBadgeColor(ticket.ticket_status)}`}>{formatStatusText(ticket.ticket_status)}</span>
                          </td>
                          <td>{formatDate(ticket.created_at)}</td>
                          <td>
                            {ticket.ticket_notes?.substring(0, 50) || "N/A"}
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
