import React, { useState, useEffect, useRef } from "react";
import * as deviceBrandService from "../../services/deviceBrand.service";
import { useNotification } from "../../hooks/useNotification";

function DeviceBrandSelector({ selectedDeviceBrand, onDeviceBrandSelect, showValidation = false }) {
  const [deviceBrands, setDeviceBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [deviceBrandSearchTerm, setDeviceBrandSearchTerm] = useState("");
  const [showDeviceBrandDropdown, setShowDeviceBrandDropdown] = useState(false);
  const [deviceBrandDropdownLocked, setDeviceBrandDropdownLocked] = useState(false);

  const [showNewDeviceBrandModal, setShowNewDeviceBrandModal] = useState(false);
  const [newDeviceBrand, setNewDeviceBrand] = useState({
    device_brand_name: "",
  });

  const deviceBrandInputRef = useRef(null);
  const { showSuccess, showError } = useNotification();

  // Seçili marka değiştiğinde input'u güncelle
  useEffect(() => {
    // Eğer seçili bir marka varsa, input değerini güncelle
    if (selectedDeviceBrand?.device_brand_id && selectedDeviceBrand?.device_brand_name) {
      setDeviceBrandSearchTerm(selectedDeviceBrand.device_brand_name);
      setDeviceBrandDropdownLocked(true);
    } else if (!selectedDeviceBrand?.device_brand_id) {
      // Eğer seçili marka temizlendiyse, input değerini de temizle
      setDeviceBrandSearchTerm("");
      setDeviceBrandDropdownLocked(false);
    }
  }, [selectedDeviceBrand]);

  // Fetch device brands on component mount
  useEffect(() => {
    const fetchDeviceBrands = async () => {
      try {
        setLoading(true);
        const data = await deviceBrandService.getAllDeviceBrands();
        setDeviceBrands(data);
        setFetchError(null);
      } catch (err) {
        setFetchError("Failed to load device brands");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceBrands();
  }, []);

  // Filter device brands based on search term
  const filteredDeviceBrands = deviceBrandSearchTerm.length >= 1 ? deviceBrands.filter((brand) => brand.device_brand_name.toLowerCase().includes(deviceBrandSearchTerm.toLowerCase())) : deviceBrands;

  // Handle dropdown visibility
  useEffect(() => {
    // If search term matches the selected device brand, don't show dropdown
    if (deviceBrandDropdownLocked && deviceBrandSearchTerm === selectedDeviceBrand?.device_brand_name) {
      setShowDeviceBrandDropdown(false);
      return;
    }
  }, [deviceBrandSearchTerm, deviceBrandDropdownLocked, selectedDeviceBrand]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (deviceBrandInputRef.current && !deviceBrandInputRef.current.contains(event.target)) {
        setShowDeviceBrandDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setShowDeviceBrandDropdown(true);
  };

  const handleDeviceBrandSearchChange = (e) => {
    const value = e.target.value;
    setDeviceBrandSearchTerm(value);
    setShowDeviceBrandDropdown(true);

    if (value !== selectedDeviceBrand?.device_brand_name) {
      setDeviceBrandDropdownLocked(false);
    }

    if (value === "") {
      onDeviceBrandSelect({
        device_brand_id: "",
        device_brand_name: "",
      });
    }
  };

  const handleNewDeviceBrandChange = (e) => {
    const { name, value } = e.target;
    setNewDeviceBrand({
      ...newDeviceBrand,
      [name]: value,
    });
  };

  const handleSaveNewDeviceBrand = async () => {
    if (!newDeviceBrand.device_brand_name.trim()) {
      showError("Device brand name cannot be empty");
      return;
    }

    try {
      // Check if a similar device brand already exists
      const existing = deviceBrands.find((brand) => brand.device_brand_name.toLowerCase() === newDeviceBrand.device_brand_name.toLowerCase());

      if (existing) {
        showError("A device brand with this name already exists");
        return;
      }

      // Save new device brand
      const createdBrandId = await deviceBrandService.createDeviceBrand(newDeviceBrand);

      // Fetch the created device brand
      const createdBrand = await deviceBrandService.getDeviceBrandById(createdBrandId);

      // Update the device brands list
      setDeviceBrands([...deviceBrands, createdBrand]);

      // Select the newly created device brand
      onDeviceBrandSelect({
        device_brand_id: createdBrand.device_brand_id,
        device_brand_name: createdBrand.device_brand_name,
      });

      // Update UI state
      setDeviceBrandSearchTerm(createdBrand.device_brand_name);
      setDeviceBrandDropdownLocked(true);
      setShowDeviceBrandDropdown(false);
      setShowNewDeviceBrandModal(false);
      showSuccess("New device brand added successfully");

      // Reset the form
      setNewDeviceBrand({ device_brand_name: "" });
    } catch (err) {
      showError("Failed to create device brand: " + (err.message || "Unknown error"));
      console.error(err);
    }
  };

  // Hata gösterme durumunun kontrolü
  const showError2 = showValidation && !selectedDeviceBrand?.device_brand_id;

  return (
    <>
      <div className="form-floating form-floating-outline mb-4 position-relative" ref={deviceBrandInputRef}>
        <input type="text" className={`form-control ${showError2 ? "is-invalid" : ""}`} id="device-brand-search" placeholder="Search device brand..." value={deviceBrandSearchTerm} onChange={handleDeviceBrandSearchChange} onFocus={handleFocus} autoComplete="off" disabled={loading} />
        <label htmlFor="device-brand-search">
          Device Brand <span className="text-danger">*</span>
        </label>
        {showError2 && <div className="invalid-feedback d-block">Device brand selection is required</div>}

        {/* Show fetch error if any */}
        {fetchError && <div className="text-danger small mt-1">{fetchError}</div>}

        {/* Loading indicator */}
        {loading && (
          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </div>
        )}

        {/* Device Brand dropdown */}
        {showDeviceBrandDropdown && !loading && (
          <div
            className="dropdown-menu d-block position-absolute w-100 overflow-auto"
            style={{
              zIndex: 1000,
              maxHeight: "200px",
            }}
          >
            {filteredDeviceBrands.length > 0 ? (
              filteredDeviceBrands.map((brand) => (
                <a
                  key={brand.device_brand_id}
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeviceBrandSelect({
                      device_brand_id: brand.device_brand_id,
                      device_brand_name: brand.device_brand_name,
                    });
                    setDeviceBrandSearchTerm(brand.device_brand_name);
                    setDeviceBrandDropdownLocked(true);
                    setShowDeviceBrandDropdown(false);
                  }}
                >
                  {brand.device_brand_name}
                </a>
              ))
            ) : (
              <div className="dropdown-item-text text-center py-2">
                <div>No matching device brands found</div>
                <button
                  className="btn btn-sm btn-primary mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeviceBrandDropdown(false);
                    setShowNewDeviceBrandModal(true);
                    if (deviceBrandSearchTerm) {
                      setNewDeviceBrand((prev) => ({
                        ...prev,
                        device_brand_name: deviceBrandSearchTerm,
                      }));
                    }
                  }}
                >
                  <i className="ri-add-line me-1"></i> Add New Device Brand
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Device Brand Modal */}
      {showNewDeviceBrandModal && (
        <div
          className={`modal fade ${showNewDeviceBrandModal ? "show" : ""}`}
          tabIndex="-1"
          aria-labelledby="newDeviceBrandModalLabel"
          aria-hidden={!showNewDeviceBrandModal}
          style={{ display: showNewDeviceBrandModal ? "block" : "none", backgroundColor: showNewDeviceBrandModal ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="newDeviceBrandModalLabel">
                  Add New Device Brand
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewDeviceBrandModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="device_brand_name" className="form-label">
                    Device Brand Name
                  </label>
                  <input type="text" className="form-control" id="device_brand_name" name="device_brand_name" value={newDeviceBrand.device_brand_name} onChange={handleNewDeviceBrandChange} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNewDeviceBrandModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveNewDeviceBrand}>
                  Save Device Brand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeviceBrandSelector;
