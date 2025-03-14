import { useState, useEffect } from "react";
import * as deviceModelService from "../services/deviceModel.service.js";
import * as deviceTypeService from "../services/deviceType.service.js";
import * as deviceBrandService from "../services/deviceBrand.service.js";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification.js";

const DeviceModels = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [deviceModels, setDeviceModels] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showSuccess, showError } = useNotification();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [deviceModelName, setDeviceModelName] = useState("");
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [nameError, setNameError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentDeviceModelId, setCurrentDeviceModelId] = useState(null);

  // Parse query parameters to get type ID and load data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeId = params.get("type");

    if (typeId) {
      setDeviceTypeId(typeId);
      loadData(typeId);
    } else {
      setLoading(false);
    }

    // Notification message if redirected from another page
    if (location.state?.success) {
      showSuccess("Success");
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Function to load type details, its brand and associated models
  const loadData = async (typeId) => {
    try {
      setLoading(true);

      // Get type details
      const typeData = await deviceTypeService.getDeviceTypeById(typeId);
      console.log("Loaded type data:", typeData);
      setSelectedType(typeData);

      // Get brand info for this type if available
      if (typeData.device_brand_id) {
        const brandData = await deviceBrandService.getDeviceBrandById(typeData.device_brand_id);
        console.log("Loaded brand data:", brandData);
        setSelectedBrand(brandData);
      }

      // Get device models for this type
      const modelsData = await deviceModelService.getAllDeviceModelsByType(typeId);
      console.log("Loaded models data:", modelsData);
      setDeviceModels(modelsData);

      setError(null);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
      showError("Could not load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredDeviceModels = deviceModels.filter((deviceModel) => {
    return (deviceModel.device_model_name && deviceModel.device_model_name.toLowerCase().includes(searchTerm.toLowerCase())) || (deviceModel.device_model_id && deviceModel.device_model_id.toString().includes(searchTerm));
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeviceModels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeviceModels.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteDeviceModel = async (id) => {
    if (window.confirm("Are you sure you want to delete this device model?")) {
      try {
        await deviceModelService.deleteDeviceModel(id);
        showSuccess("The device model has been deleted.");
        loadData(deviceTypeId); // Refresh data after deletion
      } catch (error) {
        console.error("Error deleting device model:", error);
        showError("Failed to delete device model. It may be in use by active tickets.");
      }
    }
  };

  // Modal functions
  const openAddModal = () => {
    setDeviceModelName("");
    setNameError("");
    setIsEditing(false);
    setCurrentDeviceModelId(null);
    setShowModal(true);
  };

  const openUpdateModal = (deviceModel) => {
    setDeviceModelName(deviceModel.device_model_name);
    setNameError("");
    setIsEditing(true);
    setCurrentDeviceModelId(deviceModel.device_model_id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleNameChange = (e) => {
    setDeviceModelName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  const handleSaveDeviceModel = async () => {
    // Validate
    if (!deviceModelName.trim()) {
      setNameError("Device model name is required");
      return;
    }

    if (!deviceTypeId && !isEditing) {
      showError("Please select a device type first");
      return;
    }

    try {
      if (isEditing) {
        // Update existing device model
        await deviceModelService.updateDeviceModel(currentDeviceModelId, {
          device_model_name: deviceModelName.trim(),
          // We don't change the type relationship when editing
        });
        showSuccess("The device model has been updated.");
      } else {
        // Veri kontrolü yapalım - device_type_id ve device_brand_id değerlerini kontrol edelim
        if (!deviceTypeId) {
          showError("Device type ID is missing");
          return;
        }

        const brandId = selectedType?.device_brand_id;
        if (!brandId) {
          showError("Device brand ID is missing from the selected type");
          return;
        }

        // Debug - konsola yazdıralım
        console.log("Creating new device model with:", {
          name: deviceModelName.trim(),
          type_id: deviceTypeId,
          brand_id: brandId,
        });

        // Create new device model - Sayısal olarak ID'leri göndermek daha güvenli
        const modelData = {
          device_model_name: deviceModelName.trim(),
          device_type_id: parseInt(deviceTypeId, 10),
          device_brand_id: parseInt(brandId, 10),
        };

        console.log("Sending model data:", modelData);
        const result = await deviceModelService.createDeviceModel(modelData);
        console.log("Create device model result:", result);

        showSuccess("New device model has been added.");
      }
      closeModal();
      loadData(deviceTypeId); // Refresh the list
    } catch (error) {
      console.error("Error saving device model:", error);
      showError(`${isEditing ? "Update" : "Create"} Failed`, `Failed to ${isEditing ? "update" : "create"} device model. Please try again.`);
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

  if (loading) return <div className="text-center p-5">Loading...</div>;

  // If no type is selected, show a message
  if (!deviceTypeId) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="card bg-transparent shadow-none border-0 my-4">
          <div className="card-body p-0 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold py-3 mb-4">Device Models</h4>
            </div>
            <div>
              <a href="/deviceTypes" className="btn btn-primary">
                <i className="bx bx-arrow-back me-0 me-sm-1"></i>
                <span className="d-none d-sm-inline-block">Go to Types</span>
              </a>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center py-5">
            <h5>Please select a device type first</h5>
            <p className="text-muted">Go to the Device Types page and select a type to view its models.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header and Buttons */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4">
              <span className="text-muted fw-light">Brands / Types /</span> Device Models
              {selectedBrand && selectedType && ` for ${selectedBrand.device_brand_name} ${selectedType.device_type_name}`}
            </h4>
          </div>
          <div className="d-flex">
            {deviceTypeId && (
              <button type="button" className="btn btn-primary me-2" onClick={openAddModal}>
                <i className="bx bx-plus me-0 me-sm-1"></i>
                <span className="d-none d-sm-inline-block">Add Model</span>
              </button>
            )}
            {selectedType?.device_brand_id && (
              <a href={`/deviceTypes?brand=${selectedType.device_brand_id}`} className="btn btn-outline-secondary">
                <i className="bx bx-arrow-back me-0 me-sm-1"></i>
                <span className="d-none d-sm-inline-block">Back to Types</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-12">
              <div className="form-floating form-floating-outline">
                <input type="text" className="form-control" id="searchInput" placeholder="Search by name or ID" value={searchTerm} onChange={handleSearch} />
                <label htmlFor="searchInput">Search</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info - Geliştirme sırasında faydalı */}
      <div className="alert alert-info mb-4">
        <strong>Debug Info:</strong>
        <br />
        Selected Type ID: {deviceTypeId}
        <br />
        Selected Type Name: {selectedType?.device_type_name}
        <br />
        Selected Brand ID: {selectedBrand?.device_brand_id}
        <br />
        Selected Brand Name: {selectedBrand?.device_brand_name}
        <br />
        Models Count: {deviceModels.length}
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            Device Models for {selectedBrand?.device_brand_name || ""} {selectedType?.device_type_name || "Selected Type"}
          </h5>
          <div className="card-tools">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => loadData(deviceTypeId)}>
              <i className="bx bx-refresh me-1"></i> Refresh
            </button>
          </div>
        </div>
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Model Name</th>
                <th>Type ID</th>
                <th>Brand ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDeviceModels.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              ) : (
                currentItems.map((deviceModel) => (
                  <tr key={deviceModel.device_model_id}>
                    <td>#{deviceModel.device_model_id}</td>
                    <td>{deviceModel.device_model_name}</td>
                    <td>{deviceModel.device_type_id || "N/A"}</td>
                    <td>{deviceModel.device_brand_id || "N/A"}</td>
                    <td className="">
                      <div className="d-inline-block">
                        <button type="button" className="btn rounded-pill btn-icon btn-primary waves-effect mx-2" onClick={() => openUpdateModal(deviceModel)} title="Edit Model">
                          <span className="tf-icons ri-pencil-line"></span>
                        </button>

                        <button
                          type="button"
                          className="btn rounded-pill btn-icon btn-danger waves-effect mx-2"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteDeviceModel(deviceModel.device_model_id);
                          }}
                          title="Delete Model"
                        >
                          <span className="tf-icons ri-delete-bin-6-line"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredDeviceModels.length > 0 && (
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
              Total {filteredDeviceModels.length} records, {totalPages} pages
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Device Model */}
      <div className={`modal fade ${showModal ? "show" : ""}`} id="deviceModelModal" tabIndex="-1" aria-labelledby="deviceModelModalLabel" aria-hidden={!showModal} style={{ display: showModal ? "block" : "none" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deviceModelModalLabel">
                {isEditing ? "Edit Device Model" : "Add Device Model"}
              </h5>
              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="deviceModelName" className="form-label">
                  Device Model Name
                </label>
                <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="deviceModelName" value={deviceModelName} onChange={handleNameChange} />
                {nameError && <div className="invalid-feedback">{nameError}</div>}
              </div>
              {!isEditing && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Brand</label>
                    <input type="text" className="form-control" value={selectedBrand?.device_brand_name || ""} disabled />
                    <input type="hidden" value={selectedBrand?.device_brand_id || ""} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Device Type</label>
                    <input type="text" className="form-control" value={selectedType?.device_type_name || ""} disabled />
                    <input type="hidden" value={deviceTypeId || ""} />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveDeviceModel}>
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for modal */}
      {showModal && <div className="modal-backdrop fade show" onClick={closeModal}></div>}
    </div>
  );
};

export default DeviceModels;
