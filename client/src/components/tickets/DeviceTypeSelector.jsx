import React, { useState, useEffect, useRef } from "react";
import * as deviceTypeService from "../../services/deviceType.service";
import { useNotification } from "../../hooks/useNotification";

function DeviceTypeSelector({ selectedDeviceType, onDeviceTypeSelect, selectedDeviceBrand, showValidation = false }) {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [deviceTypeSearchTerm, setDeviceTypeSearchTerm] = useState("");
  const [showDeviceTypeDropdown, setShowDeviceTypeDropdown] = useState(false);
  const [deviceTypeDropdownLocked, setDeviceTypeDropdownLocked] = useState(false);

  const [showNewDeviceTypeModal, setShowNewDeviceTypeModal] = useState(false);
  const [newDeviceType, setNewDeviceType] = useState({
    device_type_name: "",
    device_brand_id: "",
  });

  const deviceTypeInputRef = useRef(null);
  const { showSuccess, showError } = useNotification();

  // Brand değiştiğinde veya silindiğinde search term'i temizle
  useEffect(() => {
    // Eğer brand silinmişse veya değişmişse ve search term hala doluysa temizle
    if (!selectedDeviceBrand?.device_brand_id) {
      setDeviceTypeSearchTerm("");
      setDeviceTypeDropdownLocked(false);
    }
  }, [selectedDeviceBrand]);

  // Seçili tip değiştiğinde input'u güncelle
  useEffect(() => {
    // Eğer seçili bir tip varsa, input değerini güncelle
    if (selectedDeviceType?.device_type_id && selectedDeviceType?.device_type_name) {
      setDeviceTypeSearchTerm(selectedDeviceType.device_type_name);
      setDeviceTypeDropdownLocked(true);
    } else if (!selectedDeviceType?.device_type_id) {
      // Eğer seçili tip temizlendiyse, input değerini de temizle
      setDeviceTypeSearchTerm("");
      setDeviceTypeDropdownLocked(false);
    }
  }, [selectedDeviceType]);

  // Fetch device types when selectedDeviceBrand changes
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      if (!selectedDeviceBrand?.device_brand_id) {
        // Eğer marka seçilmediyse, tipleri temizle
        setDeviceTypes([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Sadece seçili markaya ait tipleri getir
        const data = await deviceTypeService.getAllDeviceTypesByBrand(selectedDeviceBrand.device_brand_id);
        setDeviceTypes(data);

        // Eğer bir tip seçiliydi ve farklı bir markaya geçildiyse tip seçimini temizle
        if (selectedDeviceType && selectedDeviceType.device_type_id) {
          const typeExists = data.some((type) => type.device_type_id === selectedDeviceType.device_type_id);
          if (!typeExists) {
            onDeviceTypeSelect({
              device_type_id: "",
              device_type_name: "",
            });
            setDeviceTypeSearchTerm("");
          }
        }

        setFetchError(null);
      } catch (err) {
        setFetchError("Failed to load device types");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceTypes();

    // Marka değiştiğinde yeni device type'ın brand_id'sini ayarla
    if (selectedDeviceBrand?.device_brand_id) {
      setNewDeviceType((prev) => ({
        ...prev,
        device_brand_id: selectedDeviceBrand.device_brand_id,
      }));
    }
  }, [selectedDeviceBrand]);

  // Filter device types based on search term
  const filteredDeviceTypes = deviceTypeSearchTerm.length >= 1 ? deviceTypes.filter((type) => type.device_type_name.toLowerCase().includes(deviceTypeSearchTerm.toLowerCase())) : deviceTypes;

  // Handle dropdown visibility
  useEffect(() => {
    // If search term matches the selected device type, don't show dropdown
    if (deviceTypeDropdownLocked && deviceTypeSearchTerm === selectedDeviceType?.device_type_name) {
      setShowDeviceTypeDropdown(false);
      return;
    }
  }, [deviceTypeSearchTerm, deviceTypeDropdownLocked, selectedDeviceType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (deviceTypeInputRef.current && !deviceTypeInputRef.current.contains(event.target)) {
        setShowDeviceTypeDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    // Eğer marka seçilmemişse, dropdown'ı açma
    if (!selectedDeviceBrand?.device_brand_id) {
      showError("Please select a device brand first");
      return;
    }

    setShowDeviceTypeDropdown(true);
  };

  const handleDeviceTypeSearchChange = (e) => {
    const value = e.target.value;
    setDeviceTypeSearchTerm(value);

    // Eğer marka seçilmişse, dropdown'ı göster
    if (selectedDeviceBrand?.device_brand_id) {
      setShowDeviceTypeDropdown(true);
    }

    if (value !== selectedDeviceType?.device_type_name) {
      setDeviceTypeDropdownLocked(false);
    }

    if (value === "") {
      onDeviceTypeSelect({
        device_type_id: "",
        device_type_name: "",
      });
    }
  };

  const handleNewDeviceTypeChange = (e) => {
    const { name, value } = e.target;
    setNewDeviceType({
      ...newDeviceType,
      [name]: value,
    });
  };

  const handleSaveNewDeviceType = async () => {
    if (!newDeviceType.device_type_name.trim()) {
      showError("Device type name cannot be empty");
      return;
    }

    if (!selectedDeviceBrand?.device_brand_id) {
      showError("Please select a device brand first");
      return;
    }

    try {
      // Check if a similar device type already exists
      const existing = deviceTypes.find((type) => type.device_type_name.toLowerCase() === newDeviceType.device_type_name.toLowerCase());

      if (existing) {
        showError("A device type with this name already exists");
        return;
      }

      // Marka ID'sini ekle
      const typeData = {
        ...newDeviceType,
        device_brand_id: selectedDeviceBrand.device_brand_id,
      };

      // Save new device type
      const createdTypeId = await deviceTypeService.createDeviceType(typeData);

      // Fetch the created device type
      const createdType = await deviceTypeService.getDeviceTypeById(createdTypeId);

      // Update the device types list
      setDeviceTypes([...deviceTypes, createdType]);

      // Select the newly created device type
      onDeviceTypeSelect({
        device_type_id: createdType.device_type_id,
        device_type_name: createdType.device_type_name,
      });

      // Update UI state
      setDeviceTypeSearchTerm(createdType.device_type_name);
      setDeviceTypeDropdownLocked(true);
      setShowDeviceTypeDropdown(false);
      setShowNewDeviceTypeModal(false);
      showSuccess("New device type added successfully");

      // Reset the form
      setNewDeviceType({
        device_type_name: "",
        device_brand_id: selectedDeviceBrand.device_brand_id,
      });
    } catch (err) {
      showError("Failed to create device type: " + (err.message || "Unknown error"));
      console.error(err);
    }
  };

  // Hata gösterme durumunun kontrolü
  const showError2 = showValidation && !selectedDeviceType?.device_type_id;

  return (
    <>
      <div className="form-floating form-floating-outline mb-4 position-relative" ref={deviceTypeInputRef}>
        <input
          type="text"
          className={`form-control ${showError2 ? "is-invalid" : ""}`}
          id="device-type-search"
          placeholder="Search device type..."
          value={deviceTypeSearchTerm}
          onChange={handleDeviceTypeSearchChange}
          onFocus={handleFocus}
          autoComplete="off"
          disabled={loading || !selectedDeviceBrand?.device_brand_id}
        />
        <label htmlFor="device-type-search">
          Device Type <span className="text-danger">*</span>
        </label>
        {showError2 && <div className="invalid-feedback d-block">Device type selection is required</div>}
        {!selectedDeviceBrand?.device_brand_id && <div className="text-muted small mt-1">Please select a device brand first</div>}

        {/* Show fetch error if any */}
        {fetchError && <div className="text-danger small mt-1">{fetchError}</div>}

        {/* Loading indicator */}
        {loading && (
          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </div>
        )}

        {/* Device Type dropdown */}
        {showDeviceTypeDropdown && !loading && selectedDeviceBrand?.device_brand_id && (
          <div
            className="dropdown-menu d-block position-absolute w-100 overflow-auto"
            style={{
              zIndex: 1000,
              maxHeight: "200px",
            }}
          >
            {filteredDeviceTypes.length > 0 ? (
              filteredDeviceTypes.map((type) => (
                <a
                  key={type.device_type_id}
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeviceTypeSelect({
                      device_type_id: type.device_type_id,
                      device_type_name: type.device_type_name,
                    });
                    setDeviceTypeSearchTerm(type.device_type_name);
                    setDeviceTypeDropdownLocked(true);
                    setShowDeviceTypeDropdown(false);
                  }}
                >
                  {type.device_type_name}
                </a>
              ))
            ) : (
              <div className="dropdown-item-text text-center py-2">
                <div>No matching device types found for {selectedDeviceBrand.device_brand_name}</div>
                <button
                  className="btn btn-sm btn-primary mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeviceTypeDropdown(false);
                    setShowNewDeviceTypeModal(true);
                    if (deviceTypeSearchTerm) {
                      setNewDeviceType((prev) => ({
                        ...prev,
                        device_type_name: deviceTypeSearchTerm,
                        device_brand_id: selectedDeviceBrand.device_brand_id,
                      }));
                    }
                  }}
                >
                  <i className="ri-add-line me-1"></i> Add New Device Type
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Device Type Modal */}
      {showNewDeviceTypeModal && (
        <div
          className={`modal fade ${showNewDeviceTypeModal ? "show" : ""}`}
          tabIndex="-1"
          aria-labelledby="newDeviceTypeModalLabel"
          aria-hidden={!showNewDeviceTypeModal}
          style={{ display: showNewDeviceTypeModal ? "block" : "none", backgroundColor: showNewDeviceTypeModal ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="newDeviceTypeModalLabel">
                  Add New Device Type for {selectedDeviceBrand?.device_brand_name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewDeviceTypeModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="device_type_name" className="form-label">
                    Device Type Name
                  </label>
                  <input type="text" className="form-control" id="device_type_name" name="device_type_name" value={newDeviceType.device_type_name} onChange={handleNewDeviceTypeChange} autoFocus />
                </div>
                <div className="mb-3">
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-control" value={selectedDeviceBrand?.device_brand_name || ""} disabled />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNewDeviceTypeModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveNewDeviceType}>
                  Save Device Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeviceTypeSelector;
