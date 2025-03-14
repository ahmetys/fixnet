import React, { useState, useEffect, useRef } from "react";
import * as deviceModelService from "../../services/deviceModel.service";
import { useNotification } from "../../hooks/useNotification";

function DeviceModelSelector({ selectedDeviceModel, onDeviceModelSelect, selectedDeviceType, selectedDeviceBrand, showValidation = false }) {
  const [deviceModels, setDeviceModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [deviceModelSearchTerm, setDeviceModelSearchTerm] = useState("");
  const [showDeviceModelDropdown, setShowDeviceModelDropdown] = useState(false);
  const [deviceModelDropdownLocked, setDeviceModelDropdownLocked] = useState(false);

  const [showNewDeviceModelModal, setShowNewDeviceModelModal] = useState(false);
  const [newDeviceModel, setNewDeviceModel] = useState({
    device_model_name: "",
    device_type_id: "",
    device_brand_id: "",
  });

  const deviceModelInputRef = useRef(null);
  const { showSuccess, showError } = useNotification();

  // Type değiştiğinde veya silindiğinde search term'i temizle
  useEffect(() => {
    // Eğer type silinmişse veya değişmişse ve search term hala doluysa temizle
    if (!selectedDeviceType?.device_type_id) {
      setDeviceModelSearchTerm("");
      setDeviceModelDropdownLocked(false);
    }
  }, [selectedDeviceType]);

  // Brand değiştiğinde de search term'i temizle
  useEffect(() => {
    // Eğer brand silinmişse search term'i temizle
    if (!selectedDeviceBrand?.device_brand_id) {
      setDeviceModelSearchTerm("");
      setDeviceModelDropdownLocked(false);
    }
  }, [selectedDeviceBrand]);

  // Seçili model değiştiğinde input'u güncelle
  useEffect(() => {
    // Eğer seçili bir model varsa, input değerini güncelle
    if (selectedDeviceModel?.device_model_id && selectedDeviceModel?.device_model_name) {
      setDeviceModelSearchTerm(selectedDeviceModel.device_model_name);
      setDeviceModelDropdownLocked(true);
    } else if (!selectedDeviceModel?.device_model_id) {
      // Eğer seçili model temizlendiyse, input değerini de temizle
      setDeviceModelSearchTerm("");
      setDeviceModelDropdownLocked(false);
    }
  }, [selectedDeviceModel]);

  // Fetch device models when selectedDeviceType changes
  useEffect(() => {
    const fetchDeviceModels = async () => {
      if (!selectedDeviceType?.device_type_id) {
        // Eğer tip seçilmediyse, modelleri temizle
        setDeviceModels([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Sadece seçili tipe ait modelleri getir
        const data = await deviceModelService.getAllDeviceModelsByType(selectedDeviceType.device_type_id);
        setDeviceModels(data);

        // Eğer bir model seçiliydi ve farklı bir tipe geçildiyse model seçimini temizle
        if (selectedDeviceModel && selectedDeviceModel.device_model_id) {
          const modelExists = data.some((model) => model.device_model_id === selectedDeviceModel.device_model_id);
          if (!modelExists) {
            onDeviceModelSelect({
              device_model_id: "",
              device_model_name: "",
            });
            setDeviceModelSearchTerm("");
          }
        }

        setFetchError(null);
      } catch (err) {
        setFetchError("Failed to load device models");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceModels();

    // Type değiştiğinde yeni device model'in type_id ve brand_id değerlerini ayarla
    if (selectedDeviceType?.device_type_id) {
      setNewDeviceModel((prev) => ({
        ...prev,
        device_type_id: selectedDeviceType.device_type_id,
        device_brand_id: selectedDeviceBrand?.device_brand_id || "",
      }));
    }
  }, [selectedDeviceType, selectedDeviceBrand]);

  // Filter device models based on search term
  const filteredDeviceModels = deviceModelSearchTerm.length >= 1 ? deviceModels.filter((model) => model.device_model_name.toLowerCase().includes(deviceModelSearchTerm.toLowerCase())) : deviceModels;

  // Handle dropdown visibility
  useEffect(() => {
    // If search term matches the selected device model, don't show dropdown
    if (deviceModelDropdownLocked && deviceModelSearchTerm === selectedDeviceModel?.device_model_name) {
      setShowDeviceModelDropdown(false);
      return;
    }
  }, [deviceModelSearchTerm, deviceModelDropdownLocked, selectedDeviceModel]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (deviceModelInputRef.current && !deviceModelInputRef.current.contains(event.target)) {
        setShowDeviceModelDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    // Eğer tip seçilmemişse, dropdown'ı açma
    if (!selectedDeviceType?.device_type_id) {
      showError("Please select a device type first");
      return;
    }

    setShowDeviceModelDropdown(true);
  };

  const handleDeviceModelSearchChange = (e) => {
    const value = e.target.value;
    setDeviceModelSearchTerm(value);

    // Eğer tip seçilmişse, dropdown'ı göster
    if (selectedDeviceType?.device_type_id) {
      setShowDeviceModelDropdown(true);
    }

    if (value !== selectedDeviceModel?.device_model_name) {
      setDeviceModelDropdownLocked(false);
    }

    if (value === "") {
      onDeviceModelSelect({
        device_model_id: "",
        device_model_name: "",
      });
    }
  };

  const handleNewDeviceModelChange = (e) => {
    const { name, value } = e.target;
    setNewDeviceModel({
      ...newDeviceModel,
      [name]: value,
    });
  };

  const handleSaveNewDeviceModel = async () => {
    if (!newDeviceModel.device_model_name.trim()) {
      showError("Device model name cannot be empty");
      return;
    }

    if (!selectedDeviceType?.device_type_id) {
      showError("Please select a device type first");
      return;
    }

    if (!selectedDeviceBrand?.device_brand_id) {
      showError("Device brand information is missing");
      return;
    }

    try {
      // Check if a similar device model already exists
      const existing = deviceModels.find((model) => model.device_model_name.toLowerCase() === newDeviceModel.device_model_name.toLowerCase());

      if (existing) {
        showError("A device model with this name already exists");
        return;
      }

      // Type ve Marka ID'lerini ekle
      const modelData = {
        ...newDeviceModel,
        device_type_id: parseInt(selectedDeviceType.device_type_id, 10),
        device_brand_id: parseInt(selectedDeviceBrand.device_brand_id, 10),
      };

      console.log("Creating model with data:", modelData);

      // Save new device model
      const createdModelId = await deviceModelService.createDeviceModel(modelData);

      // Fetch the created device model
      const createdModel = await deviceModelService.getDeviceModelById(createdModelId);

      // Update the device models list
      setDeviceModels([...deviceModels, createdModel]);

      // Select the newly created device model
      onDeviceModelSelect({
        device_model_id: createdModel.device_model_id,
        device_model_name: createdModel.device_model_name,
      });

      // Update UI state
      setDeviceModelSearchTerm(createdModel.device_model_name);
      setDeviceModelDropdownLocked(true);
      setShowDeviceModelDropdown(false);
      setShowNewDeviceModelModal(false);
      showSuccess("New device model added successfully");

      // Reset the form
      setNewDeviceModel({
        device_model_name: "",
        device_type_id: selectedDeviceType.device_type_id,
        device_brand_id: selectedDeviceBrand.device_brand_id,
      });
    } catch (err) {
      showError("Failed to create device model: " + (err.message || "Unknown error"));
      console.error(err);
    }
  };

  // Hata gösterme durumunun kontrolü
  const showError2 = showValidation && !selectedDeviceModel?.device_model_id;

  return (
    <>
      <div className="form-floating form-floating-outline mb-4 position-relative" ref={deviceModelInputRef}>
        <input
          type="text"
          className={`form-control ${showError2 ? "is-invalid" : ""}`}
          id="device-model-search"
          placeholder="Search device model..."
          value={deviceModelSearchTerm}
          onChange={handleDeviceModelSearchChange}
          onFocus={handleFocus}
          autoComplete="off"
          disabled={loading || !selectedDeviceType?.device_type_id}
        />
        <label htmlFor="device-model-search">
          Device Model <span className="text-danger">*</span>
        </label>
        {showError2 && <div className="invalid-feedback d-block">Device model selection is required</div>}
        {!selectedDeviceType?.device_type_id && <div className="text-muted small mt-1">Please select a device type first</div>}

        {/* Show fetch error if any */}
        {fetchError && <div className="text-danger small mt-1">{fetchError}</div>}

        {/* Loading indicator */}
        {loading && (
          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </div>
        )}

        {/* Device Model dropdown */}
        {showDeviceModelDropdown && !loading && selectedDeviceType?.device_type_id && (
          <div
            className="dropdown-menu d-block position-absolute w-100 overflow-auto"
            style={{
              zIndex: 1000,
              maxHeight: "200px",
            }}
          >
            {filteredDeviceModels.length > 0 ? (
              filteredDeviceModels.map((model) => (
                <a
                  key={model.device_model_id}
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeviceModelSelect({
                      device_model_id: model.device_model_id,
                      device_model_name: model.device_model_name,
                    });
                    setDeviceModelSearchTerm(model.device_model_name);
                    setDeviceModelDropdownLocked(true);
                    setShowDeviceModelDropdown(false);
                  }}
                >
                  {model.device_model_name}
                </a>
              ))
            ) : (
              <div className="dropdown-item-text text-center py-2">
                <div>No matching device models found for this type</div>
                <button
                  className="btn btn-sm btn-primary mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeviceModelDropdown(false);
                    setShowNewDeviceModelModal(true);
                    if (deviceModelSearchTerm) {
                      setNewDeviceModel((prev) => ({
                        ...prev,
                        device_model_name: deviceModelSearchTerm,
                        device_type_id: selectedDeviceType.device_type_id,
                        device_brand_id: selectedDeviceBrand?.device_brand_id,
                      }));
                    }
                  }}
                >
                  <i className="ri-add-line me-1"></i> Add New Device Model
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Device Model Modal */}
      {showNewDeviceModelModal && (
        <div
          className={`modal fade ${showNewDeviceModelModal ? "show" : ""}`}
          tabIndex="-1"
          aria-labelledby="newDeviceModelModalLabel"
          aria-hidden={!showNewDeviceModelModal}
          style={{ display: showNewDeviceModelModal ? "block" : "none", backgroundColor: showNewDeviceModelModal ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="newDeviceModelModalLabel">
                  Add New Device Model for {selectedDeviceType?.device_type_name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewDeviceModelModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="device_model_name" className="form-label">
                    Device Model Name
                  </label>
                  <input type="text" className="form-control" id="device_model_name" name="device_model_name" value={newDeviceModel.device_model_name} onChange={handleNewDeviceModelChange} autoFocus />
                </div>
                <div className="mb-3">
                  <label className="form-label">Device Type</label>
                  <input type="text" className="form-control" value={selectedDeviceType?.device_type_name || ""} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-control" value={selectedDeviceBrand?.device_brand_name || ""} disabled />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNewDeviceModelModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveNewDeviceModel}>
                  Save Device Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeviceModelSelector;
