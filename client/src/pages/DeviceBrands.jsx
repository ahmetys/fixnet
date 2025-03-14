import { useState, useEffect } from "react";
import * as deviceBrandService from "../services/deviceBrand.service.js";
import { useLocation } from "react-router-dom";
import { useNotification } from "../hooks/useNotification.js";

const DeviceBrands = () => {
  const location = useLocation();
  const [deviceBrands, setDeviceBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showSuccess, showError } = useNotification();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [deviceBrandName, setDeviceBrandName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentDeviceBrandId, setCurrentDeviceBrandId] = useState(null);

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await deviceBrandService.getAllDeviceBrands();
      setDeviceBrands(data);
      setError(null);
    } catch (err) {
      setError("Failed to load device brands");
      console.error(err);
      showError("Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Notification message if redirected from another page
    if (location.state?.success) {
      showSuccess("Success");
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Filtering logic
  const filteredDeviceBrands = deviceBrands.filter((deviceBrand) => {
    return (deviceBrand.device_brand_name && deviceBrand.device_brand_name.toLowerCase().includes(searchTerm.toLowerCase())) || (deviceBrand.device_brand_id && deviceBrand.device_brand_id.toString().includes(searchTerm));
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeviceBrands.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeviceBrands.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteDeviceBrand = async (id) => {
    if (window.confirm("Are you sure you want to delete this device brand? This will also delete all associated device types and models.")) {
      try {
        await deviceBrandService.deleteDeviceBrand(id);
        showSuccess("The device brand has been deleted.");
        fetchData(); // Refresh data after deletion
      } catch (error) {
        console.error("Error deleting device brand:", error);
        showError("Delete Failed. Brand may have associated types or models.");
      }
    }
  };

  // Modal functions
  const openAddModal = () => {
    setDeviceBrandName("");
    setNameError("");
    setIsEditing(false);
    setCurrentDeviceBrandId(null);
    setShowModal(true);
  };

  const openUpdateModal = (deviceBrand) => {
    setDeviceBrandName(deviceBrand.device_brand_name);
    setNameError("");
    setIsEditing(true);
    setCurrentDeviceBrandId(deviceBrand.device_brand_id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleNameChange = (e) => {
    setDeviceBrandName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  const handleSaveDeviceBrand = async () => {
    // Validate
    if (!deviceBrandName.trim()) {
      setNameError("Device brand name is required");
      return;
    }

    try {
      if (isEditing) {
        // Update existing device brand
        await deviceBrandService.updateDeviceBrand(currentDeviceBrandId, {
          device_brand_name: deviceBrandName.trim(),
        });
        showSuccess("The device brand has been updated.");
      } else {
        // Create new device brand
        await deviceBrandService.createDeviceBrand({
          device_brand_name: deviceBrandName.trim(),
        });
        showSuccess("New device brand has been added.");
      }
      closeModal();
      fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error saving device brand:", error);
      showError(`${isEditing ? "Update" : "Create"} Failed`, `Failed to ${isEditing ? "update" : "create"} device brand. Please try again.`);
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

  if (loading) return <div className="text-center p-5">Loading device brands...</div>;
  if (error) return <div className="alert alert-danger m-5">{error}</div>;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header and Buttons */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4">Device Brands</h4>
          </div>
          <div>
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <i className="bx bx-plus me-0 me-sm-1"></i>
              <span className="d-none d-sm-inline-block">Add Brand</span>
            </button>
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
          <h5 className="card-title mb-0">Device Brands List</h5>
          <div className="card-tools">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => window.location.reload()}>
              <i className="bx bx-refresh me-1"></i> Refresh
            </button>
          </div>
        </div>
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Brand Name</th>
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
              ) : filteredDeviceBrands.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              ) : (
                currentItems.map((deviceBrand) => (
                  <tr key={deviceBrand.device_brand_id}>
                    <td>#{deviceBrand.device_brand_id}</td>
                    <td>{deviceBrand.device_brand_name}</td>
                    <td className="">
                      <div className="d-inline-block">
                        <a href={`/deviceTypes?brand=${deviceBrand.device_brand_id}`} className="btn rounded-pill btn-icon btn-success waves-effect mx-2" title="View Device Types">
                          <span className="tf-icons bx bx-list-ul"></span>
                        </a>

                        <button type="button" className="btn rounded-pill btn-icon btn-primary waves-effect mx-2" onClick={() => openUpdateModal(deviceBrand)} title="Edit Brand">
                          <span className="tf-icons ri-pencil-line"></span>
                        </button>

                        <button
                          type="button"
                          className="btn rounded-pill btn-icon btn-danger waves-effect mx-2"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteDeviceBrand(deviceBrand.device_brand_id);
                          }}
                          title="Delete Brand"
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
        {!loading && filteredDeviceBrands.length > 0 && (
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
              Total {filteredDeviceBrands.length} records, {totalPages} pages
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Device Brand */}
      <div className={`modal fade ${showModal ? "show" : ""}`} id="deviceBrandModal" tabIndex="-1" aria-labelledby="deviceBrandModalLabel" aria-hidden={!showModal} style={{ display: showModal ? "block" : "none" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deviceBrandModalLabel">
                {isEditing ? "Edit Device Brand" : "Add Device Brand"}
              </h5>
              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="deviceBrandName" className="form-label">
                  Device Brand Name
                </label>
                <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="deviceBrandName" value={deviceBrandName} onChange={handleNameChange} />
                {nameError && <div className="invalid-feedback">{nameError}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveDeviceBrand}>
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

export default DeviceBrands;
