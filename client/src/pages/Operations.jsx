import { useState, useEffect } from "react";
import * as operationService from "../services/operation.service.js";
import { useLocation } from "react-router-dom";
import { useNotification } from "../hooks/useNotification.js";

const Operations = () => {
  const location = useLocation();
  const [operations, setoperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showSuccess, showError } = useNotification();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [operationName, setOperationName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentOperationId, setCurrentOperationId] = useState(null);

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await operationService.getAllOperations();
      setoperations(data);
      setError(null);
    } catch (err) {
      setError("Failed to load operations");
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
  const filteredOperations = operations.filter((operation) => {
    return (operation.operation_name && operation.operation_name.toLowerCase().includes(searchTerm.toLowerCase())) || (operation.operation_id && operation.operation_id.toString().includes(searchTerm));
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOperations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteOperation = async (id) => {
    if (window.confirm("Are you sure you want to delete this operation?")) {
      try {
        await operationService.deleteOperation(id);
        showSuccess("The operation has been deleted.");
        fetchData(); // Refresh data after deletion
      } catch (error) {
        console.error("Error deleting operation:", error);
        showError("Delete Failed", "Failed to delete operation. Please try again.");
      }
    }
  };

  // Modal functions
  const openAddModal = () => {
    setOperationName("");
    setNameError("");
    setIsEditing(false);
    setCurrentOperationId(null);
    setShowModal(true);
  };

  const openUpdateModal = (operation) => {
    setOperationName(operation.operation_name);
    setNameError("");
    setIsEditing(true);
    setCurrentOperationId(operation.operation_id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleNameChange = (e) => {
    setOperationName(e.target.value);
    if (e.target.value.trim()) {
      setNameError("");
    }
  };

  const handleSavedeviceModel = async () => {
    // Validate
    if (!operationName.trim()) {
      setNameError("Operation name is required");
      return;
    }

    try {
      if (isEditing) {
        // Update existing device type
        await operationService.updateOperation(currentOperationId, {
          operation_name: operationName.trim(),
        });
        showSuccess("The operation has been updated.");
      } else {
        // Create new device type
        await operationService.createOperation({
          operation_name: operationName.trim(),
        });
        showSuccess("New operation has been added.");
      }
      closeModal();
      fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error saving operation:", error);
      showError(`${isEditing ? "Update" : "Create"} Failed`, `Failed to ${isEditing ? "update" : "create"} operation. Please try again.`);
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

  if (loading) return <div className="text-center p-5">Loading operations...</div>;
  if (error) return <div className="alert alert-danger m-5">{error}</div>;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header and Buttons */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4"> Operations</h4>
          </div>
          <div>
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              Add
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
          <h5 className="card-title mb-0">Operations List</h5>
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
                <th>Operation</th>
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
              ) : filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              ) : (
                currentItems.map((operation) => (
                  <tr key={operation.operation_id}>
                    <td>#{operation.operation_id}</td>
                    <td>{operation.operation_name}</td>
                    <td className="">
                      <button type="button" className="btn rounded-pill btn-icon btn-primary waves-effect mx-2" onClick={() => openUpdateModal(operation)}>
                        <span className="tf-icons ri-pencil-line ri-22px"></span>
                      </button>

                      <button
                        type="button"
                        className="btn rounded-pill btn-icon btn-danger waves-effect mx-2"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteOperation(operation.operation_id);
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
        {!loading && filteredOperations.length > 0 && (
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
              Total {filteredOperations.length} records, {totalPages} pages
            </div>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Operation */}
      <div className={`modal fade ${showModal ? "show" : ""}`} id="operationModal" tabIndex="-1" aria-labelledby="operationModalLabel" aria-hidden={!showModal} style={{ display: showModal ? "block" : "none" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="operationModalLabel">
                {isEditing ? "Edit Operation" : "Add Operation"}
              </h5>
              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="operationName" className="form-label">
                  Operation Name
                </label>
                <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="operationName" value={operationName} onChange={handleNameChange} />
                {nameError && <div className="invalid-feedback">{nameError}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavedeviceModel}>
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

export default Operations;
