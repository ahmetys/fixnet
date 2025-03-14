import { useState, useEffect } from "react";
import * as ticketService from "../services/ticket.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import { Link } from "react-router-dom";
const Tickets = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Added navigate hook for row click navigation
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showSuccess, showError } = useNotification();
  const [ticketStatus, setTicketStatus] = useState("");
  const [ticketCounts, setTicketCounts] = useState({});
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formErrors, setFormErrors] = useState({});

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getAllTickets();
      console.log("Fetched tickets:", data);
      setTickets(data);
      setError(null);
    } catch (err) {
      setError("Failed to load tickets");
      console.error(err);
      showError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Notification message if redirected from another page
    if (location.state?.success) {
      showSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Clear search field
  const clearSearchField = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Filtering logic
  const filteredTickets = tickets.filter((ticket) => {
    // Skip filtering if there's no search term and no selected status
    if (!searchTerm && !ticketStatus) return true;

    // Apply status filter first if selected
    if (ticketStatus && (!ticket.ticket_status || ticket.ticket_status.toLowerCase() !== ticketStatus.toLowerCase())) {
      return false;
    }

    // If we have a search term, apply text search across multiple fields
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        // Search in ticket_id
        (ticket.ticket_id && ticket.ticket_id.toString().includes(searchTerm)) ||
        // Search in customer_name
        (ticket.customer_name && ticket.customer_name.toLowerCase().includes(searchTermLower)) ||
        // Search in device info
        (ticket.device_model_name && ticket.device_model_name.toLowerCase().includes(searchTermLower)) ||
        (ticket.device_brand_name && ticket.device_brand_name.toLowerCase().includes(searchTermLower))
      );
    }

    // If only status filter is applied and we passed that check, return true
    return true;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const handleTicketStatusChange = (e) => {
    setTicketStatus(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Ticket statuslarını formatlama ve renklerini belirleme fonksiyonu
  const formatStatusText = (status) => {
    if (!status) return "Unknown";

    // Özel durumlar
    if (status === "waiting_parts") return "Waiting Parts";
    if (status === "not_repaired") return "Not Repaired";

    // Genel durum: alt çizgileri boşluklarla değiştir ve her kelimenin ilk harfini büyük yap
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Duruma göre renk seçme fonksiyonu
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "waiting_parts":
        return "info";
      case "repaired":
        return "success";
      case "delivered":
        return "primary";
      case "not_repaired":
        return "danger";
      default:
        return "secondary";
    }
  };

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

  // Handle row click to navigate to ticket detail
  const handleRowClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }
    return pageNumbers;
  };

  // Filtre seçenekleri için status options
  const statusFilterOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "waiting_parts", label: "Waiting Parts" },
    { value: "repaired", label: "Repaired" },
    { value: "not_repaired", label: "Not Repaired" },
    { value: "delivered", label: "Delivered" },
  ];

  // Status badge'i gösterme fonksiyonunu güncelleyelim
  const renderStatusBadge = (ticket) => {
    let statusClass = "";
    let statusText = "";

    switch (ticket.ticket_status) {
      case "pending":
        statusClass = "bg-warning";
        statusText = "Beklemede";
        break;
      case "waiting_parts":
        statusClass = "bg-info";
        statusText = "Parça Bekliyor";
        break;
      case "repaired":
        statusClass = "bg-success";
        statusText = "Tamir Edildi";
        break;
      case "not_repaired":
        statusClass = "bg-danger";
        statusText = "Tamir Edilemedi";
        break;
      default:
        statusClass = "bg-secondary";
        statusText = "Belirsiz";
    }

    return (
      <>
        <span className={`badge ${statusClass} me-1`}>{statusText}</span>
        {ticket.ticket_delivered ? <span className="badge bg-primary">Teslim Edildi</span> : null}
      </>
    );
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4"> Service Tickets</h4>
          </div>
          <Link to="/tickets/add" className="btn btn-primary">
            Add Ticket
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-9">
              <div className="form-floating form-floating-outline">
                <input type="text" className="form-control" id="searchInput" placeholder="Search by ID, customer name, device model..." value={searchTerm} onChange={handleSearch} />
                <label htmlFor="searchInput">Search</label>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="form-group">
                <select id="statusFilter" className="form-select" value={ticketStatus} onChange={(e) => setTicketStatus(e.target.value)}>
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {searchTerm && (
            <div className="row mt-2">
              <div className="col-12 text-end">
                <button className="btn btn-outline-secondary btn-sm" onClick={clearSearchField}>
                  <i className="bx bx-x me-1"></i>Clear Search
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Tickets</h5>
          <div className="card-tools">
            <button type="button" className="btn btn-sm btn-outline-primary">
              <i className="bx bx-refresh me-1"></i> Refresh
            </button>
          </div>
        </div>
        <div className="card-datatable table-responsive">
          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="p-2">
                        <i className="ri-information-line text-primary ri-2x mb-2"></i>
                        <p>No tickets found with the current filters.</p>
                        {ticketStatus && (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setTicketStatus("")}>
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((ticket) => (
                    <tr key={ticket.ticket_id} style={{ cursor: "pointer" }} onClick={() => handleRowClick(ticket.ticket_id)}>
                      <td>#{ticket.ticket_id}</td>
                      <td>{ticket.customer_name}</td>
                      <td>{ticket.device_model_name}</td>
                      <td>{renderStatusBadge(ticket)}</td>
                      <td>{formatDate(ticket.created_at)}</td>
                      <td>{ticket.ticket_notes?.length > 60 ? ticket.ticket_notes.slice(0, 60) + "..." : ticket.ticket_notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredTickets.length > 0 && (
            <div className="card-footer">
              <nav aria-label="Page navigation">
                <ul className="pagination justify-content-center">
                  <li className={`page-item prev ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                      <i className="ri-arrow-left-line"></i>
                    </button>
                  </li>

                  {renderPageNumbers()}

                  <li className={`page-item next ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </li>
                </ul>
              </nav>
              <div className="text-center text-muted mt-1">
                Total {filteredTickets.length} records, {totalPages} pages
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;
