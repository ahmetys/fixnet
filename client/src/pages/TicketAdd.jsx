import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as ticketService from "../services/ticket.service.js";
import * as ticketLogService from "../services/ticketLog.service.js";
import { useNotification } from "../contexts/NotificationContext";
import CustomerSelector from "../components/tickets/CustomerSelector";
import DeviceTypeSelector from "../components/tickets/DeviceTypeSelector";
import DeviceBrandSelector from "../components/tickets/DeviceBrandSelector";
import DeviceModelSelector from "../components/tickets/DeviceModelSelector";
import OperationsSelector from "../components/tickets/OperationsSelector";
import SerialNumberInput from "../components/tickets/SerialNumberInput";
import AccessoriesInput from "../components/tickets/AccessoriesInput";
import SparePartsInput from "../components/tickets/SparePartsInput";
import NotesInput from "../components/tickets/NotesInput";

function TicketAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess, handleApiError } = useNotification();

  // Only keep the operation costs state here as it's shared between components
  const [operationCosts, setOperationCosts] = useState({});

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    device_type_id: "",
    device_brand_id: "",
    device_model_id: "",
    ticket_device_serial: "",
    ticket_accessories: "",
    operation_ids: [],
    ticket_notes: "",
    order_spare_parts: false,
    ticket_spare_parts: "",
    ticket_advance_pay: "0",
  });

  // Validasyon gösterme durumunu takip eden state
  const [showValidation, setShowValidation] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value || "";

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Special handling for spare parts
    if (name === "order_spare_parts") {
      if (!checked) {
        setFormData((prev) => ({
          ...prev,
          ticket_spare_parts: "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasyon durumunu true yap
    setShowValidation(true);

    // Temel validasyon kontrolleri
    if (!formData.customer_id) {
      showError("Müşteri seçimi zorunludur");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!formData.device_type_id) {
      showError("Cihaz türü seçimi zorunludur");
      return;
    }

    if (!formData.device_brand_id) {
      showError("Cihaz markası seçimi zorunludur");
      return;
    }

    if (!formData.device_model_id) {
      showError("Cihaz modeli seçimi zorunludur");
      return;
    }

    if (!formData.operation_ids || formData.operation_ids.length === 0) {
      showError("En az bir işlem seçilmelidir");
      return;
    }

    try {
      setLoading(true);

      // Format the operations with costs for the API
      const formattedTicket = { ...formData };

      // Remove estimated_cost field since it's calculated from operations
      delete formattedTicket.estimated_cost;

      // Set ticket_advance_pay to 0 if no operations are selected
      if (!formData.operation_ids || formData.operation_ids.length === 0) {
        formattedTicket.ticket_advance_pay = 0;
      }

      if (formData.operation_ids && formData.operation_ids.length > 0) {
        formattedTicket.operation_ids = formData.operation_ids.map((id) => ({
          operation_id: id,
          ticket_operation_price: operationCosts[id] || 0,
        }));
      }

      const result = await ticketService.createTicket(formattedTicket);

      // Bilet başarıyla oluşturulduğunda log kaydı oluştur
      if (result && result.ticket_id) {
        try {
          await ticketLogService.createTicketLog({
            ticket_id: result.ticket_id,
            user_id: null, // Aktif kullanıcı ID'si varsa burada eklenebilir
            log_type: "TICKET_CREATED",
            log_description: `#${result.ticket_id} numaralı bilet oluşturuldu`,
            log_details: {
              deviceType: formData.device_type_name,
              deviceBrand: formData.device_brand_name,
              deviceModel: formData.device_model_name,
              operations: formData.operation_ids.length,
              advancePayment: formData.ticket_advance_pay,
            },
          });
        } catch (logError) {
          handleApiError(logError);
          // Log kaydı hatasını kullanıcıya gösterme - ana işlem başarılı olduğu için işleme devam et
        }
      }

      showSuccess(`#${result.ticket_id} numaralı servis talebi başarıyla oluşturuldu`);
      navigate(`/tickets/${result.ticket_id}`);
    } catch (err) {
      showError("Servis talebi oluşturulurken bir hata oluştu");
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Müşteri seçiminin ardından dropdown'ın tekrar açılmasını önleyecek değişiklik
  const handleCustomerSelect = (selectedCustomer) => {
    // Form verilerini güncelle
    setFormData({
      ...formData,
      customer_id: selectedCustomer.customer_id,
      customer_name: selectedCustomer.customer_name,
    });
  };

  const handleDeviceBrandSelect = (selectedDeviceBrand) => {
    // Marka değiştiğinde, tip ve model bilgilerini sıfırla
    setFormData({
      ...formData,
      device_brand_id: selectedDeviceBrand.device_brand_id,
      device_brand_name: selectedDeviceBrand.device_brand_name,
      // Tip ve model bilgilerini sıfırla
      device_type_id: "",
      device_type_name: "",
      device_model_id: "",
      device_model_name: "",
    });
  };

  const handleDeviceTypeSelect = (selectedDeviceType) => {
    // Tip değiştiğinde, model bilgilerini sıfırla
    setFormData({
      ...formData,
      device_type_id: selectedDeviceType.device_type_id,
      device_type_name: selectedDeviceType.device_type_name,
      // Model bilgilerini sıfırla
      device_model_id: "",
      device_model_name: "",
    });
  };

  const handleDeviceModelSelect = (selectedDeviceModel) => {
    setFormData({
      ...formData,
      device_model_id: selectedDeviceModel.device_model_id,
      device_model_name: selectedDeviceModel.device_model_name,
    });
  };

  const handleOperationSelect = (operationId, defaultPrice) => {
    // Add operation ID to the selected operations
    setFormData((prev) => ({
      ...prev,
      operation_ids: [...prev.operation_ids, operationId],
    }));

    // Update operation costs with new operation
    const newCosts = { ...operationCosts, [operationId]: defaultPrice || 0 };
    setOperationCosts(newCosts);

    // Update estimated cost
    const totalCost = Object.values(newCosts).reduce((sum, cost) => sum + parseFloat(cost || 0), 0);
    setFormData((prev) => ({ ...prev, estimated_cost: totalCost }));
  };

  const handleOperationRemove = (operationId) => {
    // Remove operation from selections
    const updatedOperationIds = formData.operation_ids.filter((id) => id !== operationId);

    // Remove operation from costs
    const newCosts = { ...operationCosts };
    delete newCosts[operationId];
    setOperationCosts(newCosts);

    // Update form data
    const totalCost = Object.values(newCosts).reduce((sum, cost) => sum + parseFloat(cost || 0), 0);
    setFormData((prev) => ({
      ...prev,
      operation_ids: updatedOperationIds,
      estimated_cost: totalCost,
      ticket_advance_pay: updatedOperationIds.length === 0 ? 0 : prev.ticket_advance_pay,
    }));
  };

  const handleOperationCostChange = (operationId, cost) => {
    // Update single operation cost
    const newCosts = { ...operationCosts, [operationId]: parseFloat(cost || 0) };
    setOperationCosts(newCosts);

    // Update estimated cost
    const totalCost = Object.values(newCosts).reduce((sum, cost) => sum + parseFloat(cost || 0), 0);
    setFormData((prev) => ({ ...prev, estimated_cost: totalCost }));
  };

  // Add a dedicated handler for advance payment changes
  const handleAdvancePaymentChange = (value) => {
    handleChange({ target: { name: "ticket_advance_pay", value } });
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header and Buttons */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4">Yeni Servis Fişi</h4>
          </div>
          <div>
            <Link to="/tickets" className="btn btn-outline-secondary">
              <i className="bx bx-arrow-back me-1"></i> Servis Fişlerine Dön
            </Link>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Yeni Servis Fişi Oluştur</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} autoComplete="off">
            <CustomerSelector
              selectedCustomer={{
                customer_id: formData.customer_id,
                customer_name: formData.customer_name,
              }}
              onCustomerSelect={handleCustomerSelect}
              showValidation={showValidation}
            />

            <div className="row mt-4">
              <div className="col-md-4">
                <DeviceBrandSelector
                  selectedDeviceBrand={{
                    device_brand_id: formData.device_brand_id,
                  }}
                  onDeviceBrandSelect={handleDeviceBrandSelect}
                  showValidation={showValidation}
                />
              </div>
              <div className="col-md-4">
                <DeviceTypeSelector
                  selectedDeviceType={{
                    device_type_id: formData.device_type_id,
                    device_type_name: formData.device_type_name,
                  }}
                  onDeviceTypeSelect={handleDeviceTypeSelect}
                  selectedDeviceBrand={{
                    device_brand_id: formData.device_brand_id,
                    device_brand_name: formData.device_brand_name,
                  }}
                  showValidation={showValidation}
                />
              </div>

              <div className="col-md-4">
                <DeviceModelSelector
                  selectedDeviceModel={{
                    device_model_id: formData.device_model_id,
                    device_model_name: formData.device_model_name,
                  }}
                  onDeviceModelSelect={handleDeviceModelSelect}
                  selectedDeviceType={{
                    device_type_id: formData.device_type_id,
                    device_type_name: formData.device_type_name,
                  }}
                  selectedDeviceBrand={{
                    device_brand_id: formData.device_brand_id,
                    device_brand_name: formData.device_brand_name,
                  }}
                  showValidation={showValidation}
                />
              </div>
            </div>

            <OperationsSelector
              selectedOperations={formData.operation_ids}
              onOperationSelect={handleOperationSelect}
              onOperationRemove={handleOperationRemove}
              operationCosts={operationCosts}
              onOperationCostChange={handleOperationCostChange}
              advancePayment={formData.ticket_advance_pay}
              onAdvancePaymentChange={handleAdvancePaymentChange}
              showValidation={showValidation}
            />
            <hr />

            <div className="row">
              <div className="col-md-4">
                <SparePartsInput formData={formData} handleChange={handleChange} />
              </div>
              <div className="col-md-4">
                <SerialNumberInput formData={formData} handleChange={handleChange} />
              </div>
              <div className="col-md-4">
                <AccessoriesInput formData={formData} handleChange={handleChange} />
              </div>
            </div>

            <NotesInput formData={formData} handleChange={handleChange} />
            {/* Submit Button */}
            <div className="d-flex justify-content-between">
              <div>
                <small className="text-muted">
                  <span className="text-danger">*</span> Zorunlu alanlar
                </small>
              </div>
              <div>
                <button type="button" className="btn btn-outline-secondary waves-effect" onClick={() => navigate("/tickets")}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary waves-effect waves-light ms-2" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Oluşturuluyor...
                    </>
                  ) : (
                    "Servis Fişi Oluştur"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TicketAdd;
