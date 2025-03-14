import React, { useState, useRef, useEffect } from "react";
import * as customerService from "../../services/customer.service";
import { useNotification } from "../../hooks/useNotification";

function CustomerSelector({ selectedCustomer, onCustomerSelect, showValidation = false }) {
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerDropdownLocked, setCustomerDropdownLocked] = useState(false);
  const customerInputRef = useRef(null);
  const { showError } = useNotification();

  // New Customer Modal ile ilgili state'ler
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [newCustomer, setNewCustomer] = useState({
    customer_type: "individual",
    customer_name: "",
    customer_company: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_notification: "",
  });

  // Hata gösterme durumunun kontrolü
  const showError2 = showValidation && !selectedCustomer?.customer_id;

  // Customer dropdown kontrolü
  useEffect(() => {
    const searchCustomers = async () => {
      // Dropdown kilitliyse ve arama terimi müşteri adıyla aynıysa, dropdown'ı gösterme
      if (customerDropdownLocked && customerSearchTerm === selectedCustomer?.customer_name) {
        return;
      }

      if (customerSearchTerm.length >= 3) {
        try {
          const customers = await customerService.searchCustomer(customerSearchTerm);
          setMatchingCustomers(customers);
          setShowCustomerDropdown(true);
        } catch (err) {
          console.error("Error searching customers:", err);
        }
      } else {
        setMatchingCustomers([]);
        setShowCustomerDropdown(false);
      }
    };

    searchCustomers();
  }, [customerSearchTerm, customerDropdownLocked, selectedCustomer?.customer_name]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (customerInputRef.current && !customerInputRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);

    if (value !== selectedCustomer?.customer_name) {
      setCustomerDropdownLocked(false);
    }

    if (value === "") {
      onCustomerSelect({ customer_id: "", customer_name: "" });
    }
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;

    setNewCustomer((prev) => {
      const newCustomer = {
        ...prev,
        [name]: value || "",
      };

      if (name === "customer_type" && value === "individual") {
        newCustomer.customer_company = "";
      }

      return newCustomer;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSaveNewCustomer = async () => {
    try {
      // Müşteri verisini doğrula
      if (!newCustomer.customer_name || !newCustomer.customer_phone) {
        showError("Müşteri adı ve telefon numarası gereklidir.");
        return;
      }

      // Yeni müşteri oluştur
      const createdCustomerId = await customerService.createCustomer(newCustomer);

      // Müşteri verilerini al
      const savedCustomer = await customerService.getCustomerById(createdCustomerId);

      // Form verilerini güncelle
      onCustomerSelect({
        customer_id: savedCustomer.customer_id,
        customer_name: savedCustomer.customer_name,
      });

      setCustomerSearchTerm(savedCustomer.customer_name);
      setShowNewCustomerModal(false);

      // Dropdown'ı kapat ve kilitle
      setShowCustomerDropdown(false);
      setCustomerDropdownLocked(true);

      // Formu sıfırla
      setNewCustomer({
        customer_type: "individual",
        customer_name: "",
        customer_company: "",
        customer_phone: "",
        customer_email: "",
        customer_address: "",
        customer_notification: "",
      });
    } catch (err) {
      showError("Müşteri kaydedilirken bir hata oluştu: " + (err.message || "Bilinmeyen hata"));
    }
  };

  return (
    <>
      <div className="form-floating form-floating-outline position-relative" ref={customerInputRef}>
        <input type="text" className={`form-control ${showError2 ? "is-invalid" : ""}`} id="customer-search" placeholder="Search customer by name, phone or email..." value={customerSearchTerm} onChange={handleCustomerSearchChange} autoComplete="off" />
        <label htmlFor="customer-search">
          Customer <span className="text-danger">*</span>
        </label>
        {/* Add Button (absolute positioned) */}
        <button
          className="btn btn-primary position-absolute"
          type="button"
          onClick={() => setShowNewCustomerModal(true)}
          title="Add New Customer"
          style={{
            right: "0",
            top: "0",
            height: "100%",
            borderTopLeftRadius: "0",
            borderBottomLeftRadius: "0",
            zIndex: 5,
          }}
        >
          <i className="ri-add-large-fill"></i>
        </button>

        {/* Customer dropdown */}
        {showCustomerDropdown && (
          <div
            className="dropdown-menu d-block position-absolute w-100 overflow-auto"
            style={{
              zIndex: 1000,
              maxHeight: "200px",
            }}
          >
            {matchingCustomers.length > 0 ? (
              matchingCustomers.map((customer) => (
                <a
                  key={customer.customer_id}
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onCustomerSelect({
                      customer_id: customer.customer_id,
                      customer_name: customer.customer_name,
                    });
                    setCustomerSearchTerm(customer.customer_name);
                    setCustomerDropdownLocked(true);
                    setShowCustomerDropdown(false);
                  }}
                >
                  <div>
                    <strong>{customer.customer_name}</strong> {customer.customer_company ? `- ${customer.customer_company}` : ""}
                  </div>
                  <div className="small text-muted">
                    {customer.customer_phone} {customer.customer_email ? `| ${customer.customer_email}` : ""}
                  </div>
                </a>
              ))
            ) : (
              <div className="dropdown-item-text text-center py-2">
                <div>No matching customers found</div>
                <button
                  className="btn btn-sm btn-primary mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCustomerDropdown(false);
                    setShowNewCustomerModal(true);
                    if (customerSearchTerm) {
                      setNewCustomer((prev) => ({
                        ...prev,
                        customer_name: customerSearchTerm,
                      }));
                    }
                  }}
                >
                  <i className="ri-add-line me-1"></i> Add New Customer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {showError2 && <div className="invalid-feedback d-block">Customer selection is required</div>}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div
          className={`modal fade ${showNewCustomerModal ? "show" : ""}`}
          id="newCustomerModal"
          tabIndex="-1"
          aria-labelledby="newCustomerModalLabel"
          aria-hidden={!showNewCustomerModal}
          style={{ display: showNewCustomerModal ? "block" : "none", backgroundColor: showNewCustomerModal ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="newCustomerModalLabel">
                  Add New Customer
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewCustomerModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="customer_name" className="form-label">
                      Customer Name
                    </label>
                    <input type="text" className={`form-control ${formErrors.customer_name ? "is-invalid" : ""}`} id="customer_name" name="customer_name" value={newCustomer.customer_name} onChange={handleNewCustomerChange} autoFocus />
                    {formErrors.customer_name && <div className="invalid-feedback">{formErrors.customer_name}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label d-block">Customer Type</label>
                    <div className="form-check form-check-inline mt-2">
                      <input className="form-check-input" type="radio" name="customer_type" id="customerTypeIndividual" value="individual" checked={newCustomer.customer_type === "individual"} onChange={handleNewCustomerChange} />
                      <label className="form-check-label" htmlFor="customerTypeIndividual">
                        Individual
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="customer_type" id="customerTypeCommercial" value="commercial" checked={newCustomer.customer_type === "commercial"} onChange={handleNewCustomerChange} />
                      <label className="form-check-label" htmlFor="customerTypeCommercial">
                        Commercial
                      </label>
                    </div>
                  </div>
                </div>

                {newCustomer.customer_type === "commercial" && (
                  <div className="mb-3">
                    <label htmlFor="customer_company" className="form-label">
                      Company Name
                    </label>
                    <input type="text" className={`form-control ${formErrors.customer_company ? "is-invalid" : ""}`} id="customer_company" name="customer_company" value={newCustomer.customer_company} onChange={handleNewCustomerChange} />
                    {formErrors.customer_company && <div className="invalid-feedback">{formErrors.customer_company}</div>}
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="customer_phone" className="form-label">
                      Phone Number
                    </label>
                    <input type="text" className={`form-control ${formErrors.customer_phone ? "is-invalid" : ""}`} id="customer_phone" name="customer_phone" value={newCustomer.customer_phone} onChange={handleNewCustomerChange} />
                    {formErrors.customer_phone && <div className="invalid-feedback">{formErrors.customer_phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="customer_email" className="form-label">
                      Email
                    </label>
                    <input type="email" className={`form-control ${formErrors.customer_email ? "is-invalid" : ""}`} id="customer_email" name="customer_email" value={newCustomer.customer_email} onChange={handleNewCustomerChange} />
                    {formErrors.customer_email && <div className="invalid-feedback">{formErrors.customer_email}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="customer_address" className="form-label">
                    Address
                  </label>
                  <textarea className="form-control" id="customer_address" name="customer_address" rows="3" value={newCustomer.customer_address} onChange={handleNewCustomerChange}></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label d-block">Preferred Notification Method</label>
                  <div className="form-check form-check-inline mt-2">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationSMS" value="sms" checked={newCustomer.customer_notification === "sms"} onChange={handleNewCustomerChange} />
                    <label className="form-check-label" htmlFor="notificationSMS">
                      SMS
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationCall" value="call" checked={newCustomer.customer_notification === "call"} onChange={handleNewCustomerChange} />
                    <label className="form-check-label" htmlFor="notificationCall">
                      Call
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationEmail" value="email" checked={newCustomer.customer_notification === "email"} onChange={handleNewCustomerChange} />
                    <label className="form-check-label" htmlFor="notificationEmail">
                      Email
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationWhatsapp" value="whatsapp" checked={newCustomer.customer_notification === "whatsapp"} onChange={handleNewCustomerChange} />
                    <label className="form-check-label" htmlFor="notificationWhatsapp">
                      WhatsApp
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio" name="customer_notification" id="notificationNone" value="" checked={newCustomer.customer_notification === ""} onChange={handleNewCustomerChange} />
                    <label className="form-check-label" htmlFor="notificationNone">
                      None
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNewCustomerModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveNewCustomer}>
                  Save Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerSelector;
