import { useState, useEffect } from "react";
import * as customerService from "../services/customer.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";

const Customers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerType, setCustomerType] = useState("");
  const { showSuccess, handleApiError } = useNotification();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_type: "individual",
    customer_company: "",
    customer_notification: "call",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAllCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      handleApiError(err);
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

  // Filtering logic
  const filteredCustomers = customers.filter((customer) => {
    const searchTermLower = searchTerm.toLowerCase();

    // Type filter
    if (customerType && customer.customer_type !== customerType) {
      return false;
    }

    // Text search filter
    return (
      (customer.customer_name && customer.customer_name.toLowerCase().includes(searchTermLower)) ||
      (customer.customer_phone && customer.customer_phone.toLowerCase().includes(searchTermLower)) ||
      (customer.customer_email && customer.customer_email.toLowerCase().includes(searchTermLower)) ||
      (customer.customer_company && customer.customer_company.toLowerCase().includes(searchTermLower)) ||
      (customer.customer_id && customer.customer_id.toString().includes(searchTerm))
    );
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCustomerTypeChange = (e) => {
    setCustomerType(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm("Müşteriyi silmek istediğinize emin misiniz?")) {
      try {
        await customerService.deleteCustomer(id);
        showSuccess("Müşteri başarıyla silindi.");
        fetchData(); // Refresh data after deletion
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  // Modal functions
  const openAddModal = () => {
    setFormData({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
      customer_type: "individual",
      customer_company: "",
      customer_notification: "call",
    });
    setFormErrors({});
    setIsEditing(false);
    setCurrentCustomerId(null);
    setShowModal(true);
  };

  const openUpdateModal = (customer) => {
    setFormData({
      customer_name: customer.customer_name || "",
      customer_phone: customer.customer_phone || "",
      customer_email: customer.customer_email || "",
      customer_address: customer.customer_address || "",
      customer_type: customer.customer_type || "individual",
      customer_company: customer.customer_company || "",
      customer_notification: customer.customer_notification || "",
    });
    setFormErrors({});
    setIsEditing(true);
    setCurrentCustomerId(customer.customer_id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };

      // Reset company name if switching to individual
      if (name === "customer_type" && value === "individual") {
        newData.customer_company = "";
      }

      return newData;
    });

    // Clear the error for this field if a value is entered
    if (formErrors[name] && value.trim()) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customer_name.trim()) {
      errors.customer_name = "Name is required";
    }

    if (formData.customer_email && !/\S+@\S+\.\S+/.test(formData.customer_email)) {
      errors.customer_email = "Please enter a valid email address";
    }

    if (formData.customer_phone && !/^[0-9+\-() ]+$/.test(formData.customer_phone)) {
      errors.customer_phone = "Please enter a valid phone number";
    }

    if (formData.customer_type === "commercial" && !formData.customer_company.trim()) {
      errors.customer_company = "Company name is required for commercial customers";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async () => {
    // Validate
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        // Update existing customer
        await customerService.updateCustomer(currentCustomerId, formData);
        showSuccess("Müşteri başarıyla güncellendi.");
      } else {
        // Create new customer
        await customerService.createCustomer(formData);
        showSuccess("Yeni müşteri başarıyla eklendi.");
      }
      closeModal();
      fetchData(); // Refresh the list
    } catch (error) {
      handleApiError(error);
    }
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

  // Function to get notification type label
  const getNotificationLabel = (type) => {
    switch (type) {
      case "sms":
        return "SMS";
      case "call":
        return "Call";
      case "email":
        return "Email";
      case "whatsapp":
        return "WhatsApp";
      default:
        return "None";
    }
  };

  // Function to display customer type counts
  const getCustomerTypeCounts = () => {
    const counts = {
      total: customers.length,
      individual: customers.filter((c) => c.customer_type === "individual").length,
      commercial: customers.filter((c) => c.customer_type === "commercial").length,
    };
    return counts;
  };

  const customerCounts = getCustomerTypeCounts();

  // Müşteri detay sayfasına yönlendirme için yeni fonksiyon
  const navigateToCustomerDetail = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4"> Müşteriler</h4>
          </div>
          <div>
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              Müşteri Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-9">
              <div className="form-floating form-floating-outline">
                <input type="text" className="form-control" id="searchInput" placeholder="İsim veya ID ile arama" value={searchTerm} onChange={handleSearch} />
                <label htmlFor="searchInput">Arama</label>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-floating form-floating-outline">
                <select className="form-select" onChange={handleCustomerTypeChange} value={customerType}>
                  <option value="">Tümü ({customerCounts.total})</option>
                  <option value="individual">Bireysel ({customerCounts.individual})</option>
                  <option value="commercial">Firma ({customerCounts.commercial})</option>
                </select>
              </div>
            </div>
          </div>
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
          <h5 className="card-title mb-0">Müşteri Listesi</h5>
          <div className="card-tools"></div>
        </div>
        <div className="card-datatable table-responsive">
          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>İsim</th>
                  <th>Tür</th>
                  <th>Firma</th>
                  <th>Telefon</th>
                  <th>Email</th>
                  <th>Bildirim</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="p-2">
                        <i className="ri-information-line text-primary ri-2x mb-2"></i>
                        <p>Mevcut filtrelere uygun müşteri bulunamadı.</p>
                        {customerType && (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setCustomerType("")}>
                            Filtreleri Temizle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((customer) => (
                    <tr key={customer.customer_id} onClick={() => navigateToCustomerDetail(customer.customer_id)} style={{ cursor: "pointer" }} className="customer-table-row">
                      <td>#{customer.customer_id}</td>
                      <td>{customer.customer_name}</td>
                      <td>
                        <span className={`badge ${customer.customer_type === "commercial" ? "bg-label-primary" : "bg-label-success"}`}>{customer.customer_type === "commercial" ? "Ticari" : "Bireysel"}</span>
                      </td>
                      <td>{customer.customer_company || "-"}</td>
                      <td>{customer.customer_phone || "-"}</td>
                      <td>{customer.customer_email || "-"}</td>
                      <td>{customer.customer_notification ? <span className="badge bg-label-info">{getNotificationLabel(customer.customer_notification)}</span> : <span className="text-muted">-</span>}</td>
                      <td className="">
                        <button
                          type="button"
                          className="btn rounded-pill btn-icon btn-primary waves-effect mx-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUpdateModal(customer);
                          }}
                        >
                          <span className="tf-icons ri-pencil-line ri-22px"></span>
                        </button>

                        <button
                          type="button"
                          className="btn rounded-pill btn-icon btn-danger waves-effect mx-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer.customer_id);
                          }}
                        >
                          <span className="tf-icons ri-delete-bin-6-line ri-22px"></span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredCustomers.length > 0 && (
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
                Toplam {filteredCustomers.length} kayıt, {totalPages} sayfa
              </div>
            </div>
          )}
        </div>

        {/* Modal for Add/Edit Customer */}
        <div className={`modal fade ${showModal ? "show" : ""}`} id="customerModal" tabIndex="-1" aria-labelledby="customerModalLabel" aria-hidden={!showModal} style={{ display: showModal ? "block" : "none" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="customerModalLabel">
                  {isEditing ? "Müşteriyi Düzenle" : "Müşteri Ekle"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="customer_name" className="form-label">
                      Müşteri İsim
                    </label>
                    <input type="text" className={`form-control ${formErrors.customer_name ? "is-invalid" : ""}`} id="customer_name" name="customer_name" value={formData.customer_name} onChange={handleFormChange} autoFocus />
                    {formErrors.customer_name && <div className="invalid-feedback">{formErrors.customer_name}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label d-block">Müşteri Türü</label>
                    <div className="form-check form-check-inline mt-2">
                      <input className="form-check-input" type="radio" name="customer_type" id="customerTypeIndividual" value="individual" checked={formData.customer_type === "individual"} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="customerTypeIndividual">
                        Bireysel
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="customer_type" id="customerTypeCommercial" value="commercial" checked={formData.customer_type === "commercial"} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="customerTypeCommercial">
                        Firma
                      </label>
                    </div>
                  </div>
                </div>

                {formData.customer_type === "commercial" && (
                  <div className="mb-3">
                    <label htmlFor="customer_company" className="form-label">
                      Firma Adı
                    </label>
                    <input type="text" className={`form-control ${formErrors.customer_company ? "is-invalid" : ""}`} id="customer_company" name="customer_company" value={formData.customer_company} onChange={handleFormChange} />
                    {formErrors.customer_company && <div className="invalid-feedback">{formErrors.customer_company}</div>}
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="customer_phone" className="form-label">
                      Telefon Numarası
                    </label>
                    <input type="text" className={`form-control ${formErrors.customer_phone ? "is-invalid" : ""}`} id="customer_phone" name="customer_phone" value={formData.customer_phone} onChange={handleFormChange} />
                    {formErrors.customer_phone && <div className="invalid-feedback">{formErrors.customer_phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="customer_email" className="form-label">
                      Email Adresi
                    </label>
                    <input type="email" className={`form-control ${formErrors.customer_email ? "is-invalid" : ""}`} id="customer_email" name="customer_email" value={formData.customer_email} onChange={handleFormChange} />
                    {formErrors.customer_email && <div className="invalid-feedback">{formErrors.customer_email}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="customer_address" className="form-label">
                    Adres
                  </label>
                  <textarea className="form-control" id="customer_address" name="customer_address" rows="3" value={formData.customer_address} onChange={handleFormChange}></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label d-block">Tercih Edilen Bildirim Yöntemi</label>
                  <div className="form-check form-check-inline mt-2">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationSMS" value="sms" checked={formData.customer_notification === "sms"} onChange={handleFormChange} />
                    <label className="form-check-label" htmlFor="notificationSMS">
                      SMS
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationCall" value="call" checked={formData.customer_notification === "call"} onChange={handleFormChange} />
                    <label className="form-check-label" htmlFor="notificationCall">
                      Telefon
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationEmail" value="email" checked={formData.customer_notification === "email"} onChange={handleFormChange} />
                    <label className="form-check-label" htmlFor="notificationEmail">
                      Email
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationWhatsapp" value="whatsapp" checked={formData.customer_notification === "whatsapp"} onChange={handleFormChange} />
                    <label className="form-check-label" htmlFor="notificationWhatsapp">
                      WhatsApp
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                  İptal
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveCustomer}>
                  {isEditing ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backdrop for modal */}
        {showModal && <div className="modal-backdrop fade show" onClick={closeModal}></div>}
      </div>

      {/* CSS sınıfı için stil ekleyin (isteğe bağlı) */}
      <style>
        {`
        .customer-table-row:hover {
          background-color: #f8f9fa;
          transition: background-color 0.2s;
        }
      `}
      </style>
    </div>
  );
};

export default Customers;
