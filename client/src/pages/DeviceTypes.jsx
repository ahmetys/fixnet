import { useState, useEffect } from "react";
import * as deviceTypeService from "../services/deviceType.service.js";
import * as deviceBrandService from "../services/deviceBrand.service.js";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification.js";

const DeviceTypes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [deviceTypes, setDeviceTypes] = useState([]);
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
  const [deviceTypeName, setDeviceTypeName] = useState("");
  const [deviceBrandId, setDeviceBrandId] = useState("");
  const [nameError, setNameError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentDeviceTypeId, setCurrentDeviceTypeId] = useState(null);

  // Parse query parameters to get brand ID and load data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandId = params.get("brand");

    if (brandId) {
      setDeviceBrandId(brandId);
      loadData(brandId);
    } else {
      setLoading(false);
    }

    // Notification message if redirected from another page
    if (location.state?.success) {
      showSuccess("Success");
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Function to load brand details and its device types
  const loadData = async (brandId) => {
    try {
      setLoading(true);

      // Get brand details
      const brandData = await deviceBrandService.getDeviceBrandById(brandId);
      setSelectedBrand(brandData);

      // Get device types for this brand
      const typesData = await deviceTypeService.getAllDeviceTypesByBrand(brandId);
      setDeviceTypes(typesData);

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
  const filteredDeviceTypes = deviceTypes.filter((deviceType) => {
    return (deviceType.device_type_name && deviceType.device_type_name.toLowerCase().includes(searchTerm.toLowerCase())) || (deviceType.device_type_id && deviceType.device_type_id.toString().includes(searchTerm));
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeviceTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeviceTypes.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteDeviceType = async (id) => {
    if (window.confirm("Are you sure you want to delete this device type? This will also delete all associated models.")) {
      try {
        await deviceTypeService.deleteDeviceType(id);
        showSuccess("The device type has been deleted.");
        loadData(deviceBrandId); // Refresh data after deletion
      } catch (error) {
        console.error("Error deleting device type:", error);
        showError("Failed to delete device type. It may have associated models.");
      }
    }
  };

  // Modal functions
  const openAddModal = () => {
    setDeviceTypeName("");
    setNameError("");
    setIsEditing(false);
    setCurrentDeviceTypeId(null);
    setShowModal(true);
  };

  const openUpdateModal = (deviceType) => {
    setDeviceTypeName(deviceType.device_type_name);
    setNameError("");
    setIsEditing(true);
    setCurrentDeviceTypeId(deviceType.device_type_id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleNameChange = (e) => {
    setDeviceTypeName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  const handleSaveDeviceType = async () => {
    // Validate
    if (!deviceTypeName.trim()) {
      setNameError("Device type name is required");
      return;
    }

    if (!deviceBrandId && !isEditing) {
      showError("Please select a brand first");
      return;
    }

    try {
      if (isEditing) {
        // Update existing device type
        await deviceTypeService.updateDeviceType(currentDeviceTypeId, {
          device_type_name: deviceTypeName.trim(),
          // We don't change the brand relationship when editing
        });
        showSuccess("The device type has been updated.");
      } else {
        // Create new device type
        await deviceTypeService.createDeviceType({
          device_type_name: deviceTypeName.trim(),
          device_brand_id: deviceBrandId,
        });
        showSuccess("New device type has been added.");
      }
      closeModal();
      loadData(deviceBrandId); // Refresh the list
    } catch (error) {
      console.error("Error saving device type:", error);
      showError(`${isEditing ? "Update" : "Create"} Failed`, `Failed to ${isEditing ? "update" : "create"} device type. Please try again.`);
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

  // If no brand is selected, show a message
  if (!deviceBrandId) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="card bg-transparent shadow-none border-0 my-4">
          <div className="card-body p-0 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold py-3 mb-4">Device Types</h4>
            </div>
            <div>
              <a href="/deviceBrands" className="btn btn-primary">
                <i className="bx bx-arrow-back me-0 me-sm-1"></i>
                <span className="d-none d-sm-inline-block">Go to Brands</span>
              </a>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center py-5">
            <h5>Please select a brand first</h5>
            <p className="text-muted">Go to the Brands page and select a brand to view its device types.</p>
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
              <span className="text-muted fw-light">Brands /</span> Device Types
              {selectedBrand && ` for ${selectedBrand.device_brand_name}`}
            </h4>
          </div>
          <div className="d-flex">
            {deviceBrandId && (
              <button type="button" className="btn btn-primary me-2" onClick={openAddModal}>
                <i className="bx bx-plus me-0 me-sm-1"></i>
                <span className="d-none d-sm-inline-block">Add Type</span>
              </button>
            )}
            <a href="/deviceBrands" className="btn btn-outline-secondary">
              <i className="bx bx-arrow-back me-0 me-sm-1"></i>
              <span className="d-none d-sm-inline-block">Back to Brands</span>
            </a>
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
          <h5 className="card-title mb-0">Device Types for {selectedBrand?.device_brand_name || "Selected Brand"}</h5>
          <div className="card-tools">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => loadData(deviceBrandId)}>
              <i className="bx bx-refresh me-1"></i> Refresh
            </button>
          </div>
        </div>
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Device Type</th>
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
              ) : filteredDeviceTypes.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              ) : (
                currentItems.map((deviceType) => (
                  <tr key={deviceType.device_type_id}>
                    <td>#{deviceType.device_type_id}</td>
                    <td>{deviceType.device_type_name}</td>
                    <td className="">
                      <div className="d-inline-block">
                        <a href={`/deviceModels?type=${deviceType.device_type_id}`} className="btn rounded-pill btn-icon btn-success waves-effect mx-2" title="View Device Models">
                          <span className="tf-icons bx bx-list-ul"></span>
                        </a>

                        <button type="button" className="btn rounded-pill btn-icon btn-primary waves-effect mx-2" onClick={() => openUpdateModal(deviceType)} title="Edit Type">
                          <span className="tf-icons ri-pencil-line"></span>
                        </button>

                        <button
                          type="button"
                          className="btn rounded-pill btn-icon btn-danger waves-effect mx-2"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteDeviceType(deviceType.device_type_id);
                          }}
                          title="Delete Type"
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
        {!loading && filteredDeviceTypes.length > 0 && (
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
              Total {filteredDeviceTypes.length} records, {totalPages} pages
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Device Type */}
      <div className={`modal fade ${showModal ? "show" : ""}`} id="deviceTypeModal" tabIndex="-1" aria-labelledby="deviceTypeModalLabel" aria-hidden={!showModal} style={{ display: showModal ? "block" : "none" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deviceTypeModalLabel">
                {isEditing ? "Edit Device Type" : "Add Device Type"}
              </h5>
              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="deviceTypeName" className="form-label">
                  Device Type Name
                </label>
                <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="deviceTypeName" value={deviceTypeName} onChange={handleNameChange} />
                {nameError && <div className="invalid-feedback">{nameError}</div>}
              </div>
              {!isEditing && (
                <div className="mb-3">
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-control" value={selectedBrand?.device_brand_name || ""} disabled />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveDeviceType}>
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

export default DeviceTypes;
