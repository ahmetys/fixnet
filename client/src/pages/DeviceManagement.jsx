import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as deviceBrandService from "../services/deviceBrand.service.js";
import * as deviceTypeService from "../services/deviceType.service.js";
import * as deviceModelService from "../services/deviceModel.service.js";
import { useNotification } from "../hooks/useNotification.js";

const DeviceManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();

  // View state (which level to show: "brands", "types", or "models")
  const [currentView, setCurrentView] = useState("brands");

  // Data states
  const [deviceBrands, setDeviceBrands] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);

  // Selection states
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(""); // "brand", "type", "model"
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);

  // Form states
  const [brandName, setBrandName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [modelName, setModelName] = useState("");
  const [nameError, setNameError] = useState("");

  // URL parameter handling and navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandId = params.get("brand");
    const typeId = params.get("type");

    if (typeId) {
      setCurrentView("models");
      loadTypeDetails(typeId);
    } else if (brandId) {
      setCurrentView("types");
      loadBrandDetails(brandId);
    } else {
      setCurrentView("brands");
      loadBrands();
    }

    // Clear any previous messages
    if (location.state?.success) {
      showSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Loading functions
  const loadBrands = async () => {
    try {
      setLoading(true);
      const data = await deviceBrandService.getAllDeviceBrands();
      setDeviceBrands(data);
      setError(null);

      // Reset selections when viewing all brands
      setSelectedBrand(null);
      setSelectedType(null);
    } catch (err) {
      setError("Failed to load device brands");
      console.error(err);
      showError("Could not load brands. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadBrandDetails = async (brandId) => {
    try {
      setLoading(true);

      // Get brand details
      const brandData = await deviceBrandService.getDeviceBrandById(brandId);
      setSelectedBrand(brandData);

      // Get types for this brand
      const typesData = await deviceTypeService.getAllDeviceTypesByBrand(brandId);
      setDeviceTypes(typesData);

      // Reset type selection
      setSelectedType(null);
      setError(null);
    } catch (err) {
      setError("Failed to load brand details");
      console.error(err);
      showError("Could not load brand details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadTypeDetails = async (typeId) => {
    try {
      setLoading(true);

      // Get type details
      const typeData = await deviceTypeService.getDeviceTypeById(typeId);
      setSelectedType(typeData);

      // Get brand for this type
      if (typeData.device_brand_id) {
        const brandData = await deviceBrandService.getDeviceBrandById(typeData.device_brand_id);
        setSelectedBrand(brandData);
      }

      // Get models for this type
      const modelsData = await deviceModelService.getAllDeviceModelsByType(typeId);
      setDeviceModels(modelsData);

      setError(null);
    } catch (err) {
      setError("Failed to load type details");
      console.error(err);
      showError("Could not load type details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const navigateToBrands = () => {
    setCurrentView("brands");
    navigate("/deviceManagement");
    loadBrands();
  };

  const navigateToTypes = (brandId) => {
    setCurrentView("types");
    navigate(`/deviceManagement?brand=${brandId}`);
    loadBrandDetails(brandId);
  };

  const navigateToModels = (typeId) => {
    setCurrentView("models");
    navigate(`/deviceManagement?type=${typeId}`);
    loadTypeDetails(typeId);
  };

  // Search and pagination
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Filter functions based on current view
  const getFilteredItems = () => {
    let items = [];

    if (currentView === "brands") {
      items = deviceBrands.filter((brand) => (brand.device_brand_name && brand.device_brand_name.toLowerCase().includes(searchTerm.toLowerCase())) || (brand.device_brand_id && brand.device_brand_id.toString().includes(searchTerm)));
    } else if (currentView === "types") {
      items = deviceTypes.filter((type) => (type.device_type_name && type.device_type_name.toLowerCase().includes(searchTerm.toLowerCase())) || (type.device_type_id && type.device_type_id.toString().includes(searchTerm)));
    } else if (currentView === "models") {
      items = deviceModels.filter((model) => (model.device_model_name && model.device_model_name.toLowerCase().includes(searchTerm.toLowerCase())) || (model.device_model_id && model.device_model_id.toString().includes(searchTerm)));
    }

    return items;
  };

  // Pagination calculations
  const filteredItems = getFilteredItems();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Modal functions
  const openAddModal = (mode) => {
    setBrandName("");
    setTypeName("");
    setModelName("");
    setNameError("");
    setIsEditing(false);
    setCurrentItemId(null);
    setModalMode(mode);
    setShowModal(true);
  };

  const openEditModal = (item, mode) => {
    setIsEditing(true);
    setModalMode(mode);

    if (mode === "brand") {
      setBrandName(item.device_brand_name);
      setCurrentItemId(item.device_brand_id);
    } else if (mode === "type") {
      setTypeName(item.device_type_name);
      setCurrentItemId(item.device_type_id);
    } else if (mode === "model") {
      setModelName(item.device_model_name);
      setCurrentItemId(item.device_model_id);
    }

    setNameError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Form change handlers
  const handleBrandNameChange = (e) => {
    setBrandName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  const handleTypeNameChange = (e) => {
    setTypeName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  const handleModelNameChange = (e) => {
    setModelName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  // Save functions
  const handleSaveItem = async () => {
    try {
      if (modalMode === "brand") {
        await saveBrand();
      } else if (modalMode === "type") {
        await saveType();
      } else if (modalMode === "model") {
        await saveModel();
      }

      closeModal();

      // Refresh the current view
      if (currentView === "brands") {
        loadBrands();
      } else if (currentView === "types" && selectedBrand) {
        loadBrandDetails(selectedBrand.device_brand_id);
      } else if (currentView === "models" && selectedType) {
        loadTypeDetails(selectedType.device_type_id);
      }
    } catch (error) {
      console.error("Error saving item:", error);
      showError(`Failed to ${isEditing ? "update" : "create"} item. Please try again.`);
    }
  };

  const saveBrand = async () => {
    if (!brandName.trim()) {
      setNameError("Brand name is required");
      return;
    }

    if (isEditing) {
      await deviceBrandService.updateDeviceBrand(currentItemId, {
        device_brand_name: brandName.trim(),
      });
      showSuccess("The device brand has been updated.");
    } else {
      await deviceBrandService.createDeviceBrand({
        device_brand_name: brandName.trim(),
      });
      showSuccess("New device brand has been added.");
    }
  };

  const saveType = async () => {
    if (!typeName.trim()) {
      setNameError("Type name is required");
      return;
    }

    if (!selectedBrand && !isEditing) {
      showError("Please select a brand first");
      return;
    }

    if (isEditing) {
      await deviceTypeService.updateDeviceType(currentItemId, {
        device_type_name: typeName.trim(),
        // We don't change the brand relationship when editing
      });
      showSuccess("The device type has been updated.");
    } else {
      await deviceTypeService.createDeviceType({
        device_type_name: typeName.trim(),
        device_brand_id: selectedBrand.device_brand_id,
      });
      showSuccess("New device type has been added.");
    }
  };

  const saveModel = async () => {
    if (!modelName.trim()) {
      setNameError("Model name is required");
      return;
    }

    if (!selectedType && !isEditing) {
      showError("Please select a device type first");
      return;
    }

    if (isEditing) {
      await deviceModelService.updateDeviceModel(currentItemId, {
        device_model_name: modelName.trim(),
        // We don't change the type relationship when editing
      });
      showSuccess("The device model has been updated.");
    } else {
      // Create new device model
      const brandId = selectedBrand?.device_brand_id;
      const typeId = selectedType?.device_type_id;

      if (!typeId) {
        showError("Device type ID is missing");
        return;
      }

      if (!brandId) {
        showError("Device brand ID is missing");
        return;
      }

      await deviceModelService.createDeviceModel({
        device_model_name: modelName.trim(),
        device_type_id: parseInt(typeId, 10),
        device_brand_id: parseInt(brandId, 10),
      });
      showSuccess("New device model has been added.");
    }
  };

  // Delete functions
  const handleDeleteBrand = async (id) => {
    if (window.confirm("Are you sure you want to delete this device brand? This will also delete all associated device types and models.")) {
      try {
        await deviceBrandService.deleteDeviceBrand(id);
        showSuccess("The device brand has been deleted.");
        loadBrands(); // Refresh brands after deletion
      } catch (error) {
        console.error("Error deleting device brand:", error);
        showError("Failed to delete device brand. It may have associated types or models.");
      }
    }
  };

  const handleDeleteType = async (id) => {
    if (window.confirm("Are you sure you want to delete this device type? This will also delete all associated models.")) {
      try {
        await deviceTypeService.deleteDeviceType(id);
        showSuccess("The device type has been deleted.");

        if (selectedBrand) {
          loadBrandDetails(selectedBrand.device_brand_id); // Refresh types after deletion
        }
      } catch (error) {
        console.error("Error deleting device type:", error);
        showError("Failed to delete device type. It may have associated models.");
      }
    }
  };

  const handleDeleteModel = async (id) => {
    if (window.confirm("Are you sure you want to delete this device model?")) {
      try {
        await deviceModelService.deleteDeviceModel(id);
        showSuccess("The device model has been deleted.");

        if (selectedType) {
          loadTypeDetails(selectedType.device_type_id); // Refresh models after deletion
        }
      } catch (error) {
        console.error("Error deleting device model:", error);
        showError("Failed to delete device model. It may be in use by active tickets.");
      }
    }
  };

  // Page title and actions based on current view
  const getPageTitle = () => {
    if (currentView === "brands") {
      return "Device Brands";
    } else if (currentView === "types") {
      return selectedBrand.device_brand_name;
    } else if (currentView === "models") {
      return selectedType.device_type_name;
    }
    return "Device Management";
  };

  const getModalTitle = () => {
    const action = isEditing ? "Edit" : "Add";

    if (modalMode === "brand") {
      return `${action} Device Brand`;
    } else if (modalMode === "type") {
      return `${action} Device Type`;
    } else if (modalMode === "model") {
      return `${action} Device Model`;
    }

    return "Edit Item";
  };

  // Pagination renderer
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

  // Row click handlers
  const handleRowClick = (item) => {
    if (currentView === "brands") {
      navigateToTypes(item.device_brand_id);
    } else if (currentView === "types") {
      navigateToModels(item.device_type_id);
    }
    // Models satırına tıklandığında bir işlem yapmıyoruz çünkü alt kategorisi yok
  };

  // Loading indicator
  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Breadcrumb & Header */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4">
              {currentView === "brands" ? (
                "Device Management"
              ) : currentView === "types" ? (
                <>
                  <span className="text-muted fw-light" onClick={navigateToBrands} style={{ cursor: "pointer" }}>
                    Device Management /
                  </span>{" "}
                  {selectedBrand && `${selectedBrand.device_brand_name}`}
                </>
              ) : (
                <>
                  <span className="text-muted fw-light" onClick={navigateToBrands} style={{ cursor: "pointer" }}>
                    Device Management /
                  </span>{" "}
                  <span className="text-muted fw-light" onClick={() => selectedBrand && navigateToTypes(selectedBrand.device_brand_id)} style={{ cursor: "pointer" }}>
                    {selectedBrand.device_brand_name} /
                  </span>{" "}
                  {selectedType && `${selectedType.device_type_name}`}
                </>
              )}
            </h4>
          </div>
          <div className="d-flex">
            {currentView === "brands" && (
              <button type="button" className="btn btn-primary" onClick={() => openAddModal("brand")}>
                <i className="bx bx-plus me-0 me-sm-1"></i>
                <span className="d-none d-sm-inline-block">Add Brand</span>
              </button>
            )}

            {currentView === "types" && selectedBrand && (
              <>
                <button type="button" className="btn btn-primary me-2" onClick={() => openAddModal("type")}>
                  <i className="bx bx-plus me-0 me-sm-1"></i>
                  <span className="d-none d-sm-inline-block">Add Type</span>
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={navigateToBrands}>
                  <i className="bx bx-arrow-back me-0 me-sm-1"></i>
                  <span className="d-none d-sm-inline-block">Back to Brands</span>
                </button>
              </>
            )}

            {currentView === "models" && selectedType && (
              <>
                <button type="button" className="btn btn-primary me-2" onClick={() => openAddModal("model")}>
                  <i className="bx bx-plus me-0 me-sm-1"></i>
                  <span className="d-none d-sm-inline-block">Add Model</span>
                </button>
                {selectedBrand && (
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigateToTypes(selectedBrand.device_brand_id)}>
                    <i className="bx bx-arrow-back me-0 me-sm-1"></i>
                    <span className="d-none d-sm-inline-block">Back to Types</span>
                  </button>
                )}
              </>
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

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">{getPageTitle()}</h5>
          <div className="card-tools">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                if (currentView === "brands") {
                  loadBrands();
                } else if (currentView === "types" && selectedBrand) {
                  loadBrandDetails(selectedBrand.device_brand_id);
                } else if (currentView === "models" && selectedType) {
                  loadTypeDetails(selectedType.device_type_id);
                }
              }}
            >
              <i className="bx bx-refresh me-1"></i> Refresh
            </button>
          </div>
        </div>
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>{currentView === "brands" ? "Brand Name" : currentView === "types" ? "Type Name" : "Model Name"}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr
                    key={currentView === "brands" ? item.device_brand_id : currentView === "types" ? item.device_type_id : item.device_model_id}
                    onClick={() => currentView !== "models" && handleRowClick(item)}
                    style={currentView !== "models" ? { cursor: "pointer" } : {}}
                    className="device-table-row"
                  >
                    <td>#{currentView === "brands" ? item.device_brand_id : currentView === "types" ? item.device_type_id : item.device_model_id}</td>
                    <td>{currentView === "brands" ? item.device_brand_name : currentView === "types" ? item.device_type_name : item.device_model_name}</td>
                    <td className="">
                      <div className="d-inline-block">
                        <button
                          type="button"
                          className="btn rounded-pill btn-icon btn-primary waves-effect mx-2"
                          onClick={(e) => {
                            e.stopPropagation(); // Satır tıklamasını engelle
                            openEditModal(item, currentView === "brands" ? "brand" : currentView === "types" ? "type" : "model");
                          }}
                          title={currentView === "brands" ? "Edit Brand" : currentView === "types" ? "Edit Type" : "Edit Model"}
                        >
                          <span className="tf-icons ri-pencil-line"></span>
                        </button>

                        <button
                          type="button"
                          className="btn rounded-pill btn-icon btn-danger waves-effect mx-2"
                          onClick={(e) => {
                            e.stopPropagation(); // Satır tıklamasını engelle
                            if (currentView === "brands") {
                              handleDeleteBrand(item.device_brand_id);
                            } else if (currentView === "types") {
                              handleDeleteType(item.device_type_id);
                            } else if (currentView === "models") {
                              handleDeleteModel(item.device_model_id);
                            }
                          }}
                          title={currentView === "brands" ? "Delete Brand" : currentView === "types" ? "Delete Type" : "Delete Model"}
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
        {!loading && filteredItems.length > 0 && (
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
              Total {filteredItems.length} records, {totalPages} pages
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Item */}
      <div className={`modal fade ${showModal ? "show" : ""}`} id="itemModal" tabIndex="-1" aria-labelledby="itemModalLabel" aria-hidden={!showModal} style={{ display: showModal ? "block" : "none" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="itemModalLabel">
                {getModalTitle()}
              </h5>
              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {/* Brand Form */}
              {modalMode === "brand" && (
                <div className="mb-3">
                  <label htmlFor="brandName" className="form-label">
                    Device Brand Name
                  </label>
                  <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="brandName" value={brandName} onChange={handleBrandNameChange} />
                  {nameError && <div className="invalid-feedback">{nameError}</div>}
                </div>
              )}

              {/* Type Form */}
              {modalMode === "type" && (
                <>
                  <div className="mb-3">
                    <label htmlFor="typeName" className="form-label">
                      Device Type Name
                    </label>
                    <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="typeName" value={typeName} onChange={handleTypeNameChange} />
                    {nameError && <div className="invalid-feedback">{nameError}</div>}
                  </div>
                  {!isEditing && selectedBrand && (
                    <div className="mb-3">
                      <label className="form-label">Brand</label>
                      <input type="text" className="form-control" value={selectedBrand?.device_brand_name || ""} disabled />
                    </div>
                  )}
                </>
              )}

              {/* Model Form */}
              {modalMode === "model" && (
                <>
                  <div className="mb-3">
                    <label htmlFor="modelName" className="form-label">
                      Device Model Name
                    </label>
                    <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="modelName" value={modelName} onChange={handleModelNameChange} />
                    {nameError && <div className="invalid-feedback">{nameError}</div>}
                  </div>
                  {!isEditing && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Brand</label>
                        <input type="text" className="form-control" value={selectedBrand?.device_brand_name || ""} disabled />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Device Type</label>
                        <input type="text" className="form-control" value={selectedType?.device_type_name || ""} disabled />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveItem}>
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for modal */}
      {showModal && <div className="modal-backdrop fade show" onClick={closeModal}></div>}

      {/* Satır tıklama efekti için stil */}
      <style>
        {`
        .device-table-row:hover {
          background-color: #f8f9fa;
          transition: background-color 0.2s;
        }
      `}
      </style>
    </div>
  );
};

export default DeviceManagement;
