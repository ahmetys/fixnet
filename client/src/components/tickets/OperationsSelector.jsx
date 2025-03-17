import React, { useState, useEffect, useRef } from "react";
import * as operationService from "../../services/operation.service";
import { useNotification } from "../../contexts/NotificationContext";

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
  const { showError, handleApiError } = useNotification();

  // Tahmini maliyet hesapla
  const estimatedCost = selectedOperations.reduce((total, operationId) => total + parseFloat(operationCosts[operationId] || 0), 0);

  // Kalan bakiye hesapla
  const remainingBalance = estimatedCost - parseFloat(advancePayment || 0);

  // Hata gösterme durumunun kontrolü
  const validationError = showValidation && (!selectedOperations || selectedOperations.length === 0);

  // İşlemleri component yüklendiğinde getir
  useEffect(() => {
    const fetchOperations = async () => {
      try {
        setLoading(true);
        const data = await operationService.getAllOperations();
        setOperations(data);
        setError(null);
      } catch (err) {
        setError("İşlemler yüklenirken hata oluştu");
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperations();
  }, [handleApiError]);

  // Yeni eklenen işlemin fiyat input'una odaklan
  useEffect(() => {
    if (newlyAddedOperationId && priceInputRefs.current[newlyAddedOperationId]) {
      // DOM güncellemesinden emin olmak için küçük bir gecikme
      setTimeout(() => {
        const inputRef = priceInputRefs.current[newlyAddedOperationId];
        if (inputRef) {
          inputRef.focus();
          // Metni seç
          inputRef.select();
        }
        setNewlyAddedOperationId(null);
      }, 10);
    }
  }, [newlyAddedOperationId, selectedOperations]);

  // Arama terimine göre işlemleri filtrele, zaten seçilenleri hariç tut
  const filteredOperations = operationSearchTerm.length >= 1 ? operations.filter((op) => op.operation_name.toLowerCase().includes(operationSearchTerm.toLowerCase()) && !selectedOperations.includes(op.operation_id)) : operations.filter((op) => !selectedOperations.includes(op.operation_id));

  // Dışarı tıklandığında dropdown'ı kapat
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
    // Container içine tıklanırsa blur etme
    if (operationInputRef.current && operationInputRef.current.contains(e.relatedTarget)) {
      return;
    }

    // Dropdown öğesine tıklanırsa blur etme
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
      showError("İşlem adı boş olamaz");
      return;
    }

    try {
      // Benzer bir işlem var mı kontrol et
      const existing = operations.find((op) => op.operation_name.toLowerCase() === newOperation.operation_name.toLowerCase());

      if (existing) {
        showError("Bu isimde bir işlem zaten mevcut");
        return;
      }

      // Yeni işlemi kaydet
      const createdOperationId = await operationService.createOperation(newOperation);

      // Oluşturulan işlemi getir
      const createdOperation = await operationService.getOperationById(createdOperationId);

      // İşlemler listesini güncelle
      setOperations([...operations, createdOperation]);

      // Yeni oluşturulan işlemi seç
      onOperationSelect(createdOperation.operation_id, parseFloat(createdOperation.operation_default_price || 0));
      setNewlyAddedOperationId(createdOperation.operation_id);

      // UI durumunu güncelle
      setOperationSearchTerm("");
      setShowOperationDropdown(false);
      setShowNewOperationModal(false);

      // Formu sıfırla
      setNewOperation({
        operation_name: "",
        operation_default_price: "",
      });
    } catch (err) {
      showError("İşlem oluşturulurken hata oluştu");
      handleApiError(err);
    }
  };

  // Avans ödeme değişikliği
  const handleAdvancePaymentChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      onAdvancePaymentChange("");
      return;
    }

    // Değerin negatif olmadığından emin ol
    const parsedValue = parseFloat(value);
    if (parsedValue < 0) return;

    // Değerin tahmini maliyeti aşmadığından emin ol
    if (parsedValue > estimatedCost) {
      onAdvancePaymentChange(estimatedCost.toString());
      return;
    }

    onAdvancePaymentChange(value);
  };

  const resetAdvancePayment = (e) => {
    e.preventDefault();
    onAdvancePaymentChange("");
  };

  const setFullPayment = (e) => {
    e.preventDefault();
    onAdvancePaymentChange(estimatedCost.toString());
  };

  // İnput değerini güzel formatlayan yardımcı fonksiyon
  const formatInputValue = (value) => {
    if (!value && value !== 0) return "";
    return value;
  };

  // Sayıyı para birimi olarak formatla
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "₺0,00";

    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(value);
  };

  return (
    <div className="mb-4">
      {/* Hata göster */}
      {error && <div className="alert alert-warning mb-3">{error}</div>}

      {/* İşlem Giriş Alanı */}
      <div className="row mb-3">
        <div className="col">
          <div className="form-floating form-floating-outline position-relative" ref={operationInputRef}>
            <div
              className={`form-control ${isInputFocused ? "border-primary" : ""} ${validationError ? "is-invalid" : ""} d-flex flex-wrap align-items-center`}
              style={{ height: "auto", minHeight: "calc(3.5rem + 2px)", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              onClick={() => inputRef.current?.focus()}
            >
              {/* Seçili İşlem Etiketleri */}
              {selectedOperations.length > 0 &&
                selectedOperations.map((operationId) => {
                  const operation = operations.find((op) => op.operation_id === operationId);
                  return (
                    <div key={operationId} className="badge bg-primary me-1 mb-1 d-flex align-items-center" style={{ fontSize: "0.875rem" }}>
                      <span>{operation?.operation_name || "Bilinmeyen"}</span>
                      <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: "0.5rem" }} onClick={() => onOperationRemove(operationId)} aria-label="Kaldır"></button>
                    </div>
                  );
                })}

              {/* Arama Girişi */}
              <input
                ref={inputRef}
                type="text"
                className="border-0 flex-grow-1 bg-transparent p-0 ps-1"
                placeholder={selectedOperations.length ? "Daha fazla işlem ekle..." : "Servis İşlemi *"}
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
                İşlem Ara<span className="text-danger"> *</span>
              </label>
            )}

            {validationError && <div className="invalid-feedback d-block">En az bir işlem seçilmelidir</div>}

            {/* Yükleniyor göstergesi */}
            {loading && (
              <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </div>
            )}

            {/* İşlemler dropdown */}
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
                        onOperationSelect(operation.operation_id, parseFloat(operation.operation_default_price || 0));
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
                    <div>Eşleşen işlem bulunamadı</div>
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
                      <i className="ri-add-line me-1"></i> Yeni İşlem Ekle
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seçili İşlemler Tablosu - Sadece işlem seçildiğinde göster */}
      {selectedOperations.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered m-0">
            <thead>
              <tr>
                <th>İşlem</th>
                <th style={{ width: "200px" }}>Fiyat</th>
                <th style={{ width: "80px" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {selectedOperations.map((operationId) => {
                const operation = operations.find((op) => op.operation_id === operationId);
                return (
                  <tr key={operationId}>
                    <td>{operation?.operation_name || "Silinmiş İşlem"}</td>
                    <td>
                      <div className="input-group">
                        <span className="input-group-text">₺</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formatInputValue(operationCosts[operationId])}
                          onChange={(e) => {
                            const newCost = e.target.value;
                            onOperationCostChange(operationId, newCost);
                          }}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
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

              {/* Toplam ve Avans Ödeme Satırları */}
              <tr>
                <td className="text-end fw-bold">Tahmini Toplam:</td>
                <td colSpan="2" className="fw-bold">
                  {formatCurrency(estimatedCost)}
                </td>
              </tr>
              <tr>
                <td className="text-end fw-bold">Avans Ödeme:</td>
                <td>
                  <div className="input-group">
                    <span className="input-group-text">₺</span>
                    <input type="number" className="form-control" value={formatInputValue(advancePayment)} onChange={handleAdvancePaymentChange} min="0" max={estimatedCost} step="0.01" placeholder="0.00" />
                  </div>
                </td>
                <td className="text-center">
                  <div className="btn-group">
                    <button className="btn btn-sm btn-icon btn-outline-secondary" onClick={resetAdvancePayment} title="Avansı Sıfırla">
                      <i className="ri-refresh-line"></i>
                    </button>
                    <button className="btn btn-sm btn-icon btn-outline-primary" onClick={setFullPayment} title="Tam Ödeme">
                      <i className="ri-wallet-3-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="text-end fw-bold">Kalan Bakiye:</td>
                <td colSpan="2" className="fw-bold">
                  {formatCurrency(remainingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Yeni İşlem Modalı */}
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
                  Yeni İşlem Ekle
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewOperationModal(false)} aria-label="Kapat"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="operation_name" className="form-label">
                    İşlem Adı
                  </label>
                  <input type="text" className="form-control" id="operation_name" name="operation_name" value={newOperation.operation_name} onChange={handleNewOperationChange} autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNewOperationModal(false)}>
                  İptal
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveNewOperation}>
                  İşlemi Kaydet
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
