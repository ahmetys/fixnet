import React, { useState, useEffect, useRef } from "react";
import * as operationService from "../../services/operation.service";
import { useNotification } from "../../hooks/useNotification";

function OperationsSelector({ selectedOperations, onOperationSelect, onOperationRemove, operationCosts, onOperationCostChange, advancePayment, onAdvancePaymentChange, showValidation = false }) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [operationSearchTerm, setOperationSearchTerm] = useState("");
  const [showOperationDropdown, setShowOperationDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [newlyAddedOperationId, setNewlyAddedOperationId] = useState(null);

  const [showNewOperationModal, setShowNewOperationModal] = useState(false);
  const [newOperation, setNewOperation] = useState({
    operation_name: "",
  });

  const operationInputRef = useRef(null);
  const inputRef = useRef(null);
  const priceInputRefs = useRef({});
  const { showError } = useNotification();

  // Calculate estimated cost
  const estimatedCost = selectedOperations.reduce((total, operationId) => total + parseFloat(operationCosts[operationId] || 0), 0);

  // Calculate remaining balance
  const remainingBalance = estimatedCost - parseFloat(advancePayment || 0);

  // Fetch operations on component mount
  useEffect(() => {
    const fetchOperations = async () => {
      try {
        setLoading(true);
        const data = await operationService.getAllOperations();
        setOperations(data);
        setError(null);
      } catch (err) {
        setError("Failed to load operations");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperations();
  }, []);

  // Focus on the newly added operation's price input
  useEffect(() => {
    if (newlyAddedOperationId && priceInputRefs.current[newlyAddedOperationId]) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        priceInputRefs.current[newlyAddedOperationId]?.focus();
        setNewlyAddedOperationId(null);
      }, 10);
    }
  }, [newlyAddedOperationId, selectedOperations]);

  // Filter operations based on search term, excluding already selected operations
  const filteredOperations = operationSearchTerm.length >= 1 ? operations.filter((op) => op.operation_name.toLowerCase().includes(operationSearchTerm.toLowerCase()) && !selectedOperations.includes(op.operation_id)) : operations.filter((op) => !selectedOperations.includes(op.operation_id));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (operationInputRef.current && !operationInputRef.current.contains(event.target)) {
        setShowOperationDropdown(false);
        setIsInputFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setShowOperationDropdown(true);
    setIsInputFocused(true);
  };

  const handleBlur = (e) => {
    // Don't blur if clicking inside the container
    if (operationInputRef.current && operationInputRef.current.contains(e.relatedTarget)) {
      return;
    }

    // Don't blur if clicking on a dropdown item
    if (e.relatedTarget && e.relatedTarget.classList.contains("dropdown-item")) {
      return;
    }

    setIsInputFocused(false);
  };

  const handleOperationSearchChange = (e) => {
    const value = e.target.value;
    setOperationSearchTerm(value);
    setShowOperationDropdown(true);
  };

  const handleNewOperationChange = (e) => {
    const { name, value } = e.target;
    setNewOperation({
      ...newOperation,
      [name]: value,
    });
  };

  const handleSaveNewOperation = async () => {
    if (!newOperation.operation_name.trim()) {
      showError("Operation name cannot be empty");
      return;
    }

    try {
      // Check if a similar operation already exists
      const existing = operations.find((op) => op.operation_name.toLowerCase() === newOperation.operation_name.toLowerCase());

      if (existing) {
        showError("An operation with this name already exists");
        return;
      }

      // Save new operation
      const createdOperationId = await operationService.createOperation(newOperation);

      // Fetch the created operation
      const createdOperation = await operationService.getOperationById(createdOperationId);

      // Update the operations list
      setOperations([...operations, createdOperation]);

      // Select the newly created operation
      onOperationSelect(createdOperation.operation_id, parseFloat(createdOperation.operation_default_price));
      setNewlyAddedOperationId(createdOperation.operation_id);

      // Update UI state
      setOperationSearchTerm("");
      setShowOperationDropdown(false);
      setShowNewOperationModal(false);

      // Reset the form
      setNewOperation({
        operation_name: "",
        operation_default_price: "0",
      });
    } catch (err) {
      showError("Failed to create operation: " + (err.message || "Unknown error"));
      console.error(err);
    }
  };

  // Handle advance payment change
  const handleAdvancePaymentChange = (e) => {
    const value = e.target.value;

    // Ensure value is not negative
    const parsedValue = parseFloat(value);
    if (parsedValue < 0) return;

    // Ensure value doesn't exceed estimated cost
    if (parsedValue > estimatedCost) {
      onAdvancePaymentChange(estimatedCost.toString());
      return;
    }

    onAdvancePaymentChange(value);
  };

  const resetAdvancePayment = (e) => {
    e.preventDefault();
    onAdvancePaymentChange("0");
  };

  // Format number as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Hata gösterme durumunun kontrolü
  const showError2 = showValidation && (!selectedOperations || selectedOperations.length === 0);

  return (
    <div className="mb-4">
      {/* Show fetch error if any */}
      {error && <div className="alert alert-warning mb-3">{error}</div>}

      {/* Operation Input with Tags */}
      <div className="row mb-3">
        <div className="col">
          <div className="form-floating form-floating-outline position-relative" ref={operationInputRef}>
            <div
              className={`form-control ${isInputFocused ? "border-primary" : ""} ${showError2 ? "is-invalid" : ""} d-flex flex-wrap align-items-center`}
              style={{ height: "auto", minHeight: "calc(3.5rem + 2px)", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              onClick={() => inputRef.current?.focus()}
            >
              {/* Selected Operation Tags */}
              {selectedOperations.length > 0 &&
                selectedOperations.map((operationId) => {
                  const operation = operations.find((op) => op.operation_id === operationId);
                  return (
                    <div key={operationId} className="badge bg-primary me-1 mb-1 d-flex align-items-center" style={{ fontSize: "0.875rem" }}>
                      <span>{operation?.operation_name || "Unknown"}</span>
                      <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: "0.5rem" }} onClick={() => onOperationRemove(operationId)} aria-label="Remove"></button>
                    </div>
                  );
                })}

              {/* Search Input */}
              <input
                ref={inputRef}
                type="text"
                className="border-0 flex-grow-1 bg-transparent p-0 ps-1"
                placeholder={selectedOperations.length ? "Add more operations..." : "Service Operation *"}
                value={operationSearchTerm}
                onChange={handleOperationSearchChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={loading}
                style={{ outline: "none", minWidth: "100px" }}
              />
            </div>
            {isInputFocused && (
              <label className="text-primary" htmlFor="operation-search" style={{ opacity: selectedOperations.length > 0 ? 0 : 1 }}>
                Search Operation<span className="text-danger"> *</span>
              </label>
            )}

            {showError2 && <div className="invalid-feedback d-block">At least one operation must be selected</div>}

            {/* Loading indicator */}
            {loading && (
              <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </div>
            )}

            {/* Operations dropdown */}
            {showOperationDropdown && !loading && (
              <div
                className="dropdown-menu d-block position-absolute w-100 overflow-auto"
                style={{
                  zIndex: 1000,
                  maxHeight: "200px",
                }}
              >
                {filteredOperations.length > 0 ? (
                  filteredOperations.map((operation) => (
                    <a
                      key={operation.operation_id}
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onOperationSelect(operation.operation_id, parseFloat(operation.operation_default_price));
                        setOperationSearchTerm("");
                        setShowOperationDropdown(false);
                        setNewlyAddedOperationId(operation.operation_id);
                      }}
                    >
                      {operation.operation_name}
                    </a>
                  ))
                ) : (
                  <div className="dropdown-item-text text-center py-2">
                    <div>No matching operations found</div>
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowOperationDropdown(false);
                        setShowNewOperationModal(true);
                        if (operationSearchTerm) {
                          setNewOperation((prev) => ({
                            ...prev,
                            operation_name: operationSearchTerm,
                          }));
                        }
                      }}
                    >
                      <i className="ri-add-line me-1"></i> Add New Operation
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Operations Table - Only show when operations are selected */}
      {selectedOperations.length > 0 && (
        <div className="table-responsive ">
          <table className="table table-bordered m-0">
            <thead>
              <tr>
                <th>Operation</th>
                <th style={{ width: "200px" }}>Price</th>
                <th style={{ width: "80px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedOperations.map((operationId) => {
                const operation = operations.find((op) => op.operation_id === operationId);
                return (
                  <tr key={operationId}>
                    <td>{operation?.operation_name || "Deleted Operation"}</td>
                    <td>
                      <div className="input-group">
                        <span className="input-group-text">€</span>
                        <input
                          type="number"
                          className="form-control"
                          value={operationCosts[operationId] || 0}
                          onChange={(e) => {
                            const newCost = e.target.value;
                            onOperationCostChange(operationId, newCost);
                          }}
                          min="0"
                          step="0.01"
                          ref={(el) => (priceInputRefs.current[operationId] = el)}
                        />
                      </div>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-icon btn-outline-danger" onClick={() => onOperationRemove(operationId)}>
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Total and Advance Payment rows */}
              <tr>
                <td className="text-end fw-bold">Estimated Total:</td>
                <td colSpan="2" className="fw-bold">
                  {formatCurrency(estimatedCost)}
                </td>
              </tr>
              <tr>
                <td className="text-end fw-bold">Advance Payment:</td>
                <td>
                  <div className="input-group">
                    <span className="input-group-text">€</span>
                    <input type="number" className="form-control" value={advancePayment} onChange={handleAdvancePaymentChange} min="0" max={estimatedCost} step="0.01" />
                  </div>
                </td>
                <td className="text-center">
                  <button className="btn btn-sm btn-icon btn-outline-primary" onClick={(e) => resetAdvancePayment(e)}>
                    <i className="ri-refresh-line"></i>
                  </button>
                </td>
              </tr>
              <tr>
                <td className="text-end fw-bold">Remaining Balance:</td>
                <td colSpan="2" className="fw-bold">
                  {formatCurrency(remainingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* New Operation Modal */}
      {showNewOperationModal && (
        <div
          className={`modal fade ${showNewOperationModal ? "show" : ""}`}
          tabIndex="-1"
          aria-labelledby="newOperationModalLabel"
          aria-hidden={!showNewOperationModal}
          style={{ display: showNewOperationModal ? "block" : "none", backgroundColor: showNewOperationModal ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="newOperationModalLabel">
                  Add New Operation
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewOperationModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="operation_name" className="form-label">
                    Operation Name
                  </label>
                  <input type="text" className="form-control" id="operation_name" name="operation_name" value={newOperation.operation_name} onChange={handleNewOperationChange} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNewOperationModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveNewOperation}>
                  Save Operation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationsSelector;
