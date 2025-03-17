import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as deviceManagementService from "../services/deviceManagement.service";
import { useNotification } from "../contexts/NotificationContext";

const DeviceManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, handleApiError } = useNotification();

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

  // Form validation errors
  const [nameError, setNameError] = useState("");

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
  }, [location, showSuccess]);

  // Loading functions
  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deviceManagementService.getAllDeviceBrands();
      setDeviceBrands(data);

      // Reset selections when viewing all brands
      setSelectedBrand(null);
      setSelectedType(null);
      setError(null);
    } catch (err) {
      setError("Cihaz markaları yüklenemedi");
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const loadBrandDetails = useCallback(
    async (brandId) => {
      try {
        setLoading(true);

        // Get brand details
        const brandData = await deviceManagementService.getDeviceBrandById(brandId);
        setSelectedBrand(brandData);

        // Get types for this brand
        const typesData = await deviceManagementService.getAllDeviceTypesByBrand(brandId);
        setDeviceTypes(typesData);

        // Reset type selection
        setSelectedType(null);
        setError(null);
      } catch (err) {
        setError("Cihaz marka detayları yüklenemedi");
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError]
  );

  const loadTypeDetails = useCallback(
    async (typeId) => {
      try {
        setLoading(true);

        // Get type details
        const typeData = await deviceManagementService.getDeviceTypeById(typeId);
        setSelectedType(typeData);

        // Get brand for this type
        if (typeData.device_brand_id) {
          const brandData = await deviceManagementService.getDeviceBrandById(typeData.device_brand_id);
          setSelectedBrand(brandData);
        }

        // Get models for this type
        const modelsData = await deviceManagementService.getAllDeviceModelsByType(typeId);
        setDeviceModels(modelsData);

        setError(null);
      } catch (err) {
        setError("Cihaz türü detayları yüklenemedi");
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError]
  );

  // Navigation functions
  const navigateToBrands = useCallback(() => {
    setCurrentView("brands");
    navigate("/deviceManagement");
    loadBrands();
  }, [navigate, loadBrands]);

  const navigateToTypes = useCallback(
    (brandId) => {
      setCurrentView("types");
      navigate(`/deviceManagement?brand=${brandId}`);
      loadBrandDetails(brandId);
    },
    [navigate, loadBrandDetails]
  );

  const navigateToModels = useCallback(
    (typeId) => {
      setCurrentView("models");
      navigate(`/deviceManagement?type=${typeId}`);
      loadTypeDetails(typeId);
    },
    [navigate, loadTypeDetails]
  );

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
    setIsEditing(false);
    setCurrentItemId(null);
    setModalMode(mode);
    setNameError("");
    setShowModal(true);
  };

  const openEditModal = (item, mode) => {
    setIsEditing(true);
    setModalMode(mode);
    setNameError("");

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

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNameError("");
  };

  // Form change handlers
  const handleBrandNameChange = (e) => {
    setBrandName(e.target.value);
    if (nameError) setNameError("");
  };

  const handleTypeNameChange = (e) => {
    setTypeName(e.target.value);
    if (nameError) setNameError("");
  };

  const handleModelNameChange = (e) => {
    setModelName(e.target.value);
    if (nameError) setNameError("");
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
      handleApiError(error);
    }
  };

  const saveBrand = async () => {
    if (!brandName.trim()) {
      setNameError("Marka adı gereklidir");
      return Promise.reject(new Error("Marka adı gereklidir"));
    }

    try {
      if (isEditing) {
        await deviceManagementService.updateDeviceBrand(currentItemId, {
          device_brand_name: brandName.trim(),
        });
        showSuccess("Cihaz markası güncellendi.");
      } else {
        await deviceManagementService.createDeviceBrand({
          device_brand_name: brandName.trim(),
        });
        showSuccess("Yeni cihaz markası eklendi.");
      }
      return Promise.resolve();
    } catch (error) {
      handleApiError(error);
      return Promise.reject(error);
    }
  };

  const saveType = async () => {
    if (!typeName.trim()) {
      setNameError("Tür adı gereklidir");
      return Promise.reject(new Error("Tür adı gereklidir"));
    }

    if (!selectedBrand && !isEditing) {
      showError("Lütfen bir marka seçiniz");
      return Promise.reject(new Error("Marka seçimi gereklidir"));
    }

    try {
      if (isEditing) {
        await deviceManagementService.updateDeviceType(currentItemId, {
          device_type_name: typeName.trim(),
          // We don't change the brand relationship when editing
        });
        showSuccess("Cihaz türü güncellendi.");
      } else {
        await deviceManagementService.createDeviceType({
          device_type_name: typeName.trim(),
          device_brand_id: selectedBrand.device_brand_id,
        });
        showSuccess("Yeni cihaz türü eklendi.");
      }
      return Promise.resolve();
    } catch (error) {
      handleApiError(error);
      return Promise.reject(error);
    }
  };

  const saveModel = async () => {
    if (!modelName.trim()) {
      setNameError("Model adı gereklidir");
      return Promise.reject(new Error("Model adı gereklidir"));
    }

    if (!selectedType && !isEditing) {
      showError("Lütfen bir cihaz türü seçiniz");
      return Promise.reject(new Error("Tür seçimi gereklidir"));
    }

    try {
      if (isEditing) {
        await deviceManagementService.updateDeviceModel(currentItemId, {
          device_model_name: modelName.trim(),
          // We don't change the type relationship when editing
        });
        showSuccess("Cihaz modeli güncellendi.");
      } else {
        // Create new device model
        const brandId = selectedBrand?.device_brand_id;
        const typeId = selectedType?.device_type_id;

        if (!typeId) {
          showError("Cihaz türü ID'si eksik");
          return Promise.reject(new Error("Cihaz türü ID'si eksik"));
        }

        if (!brandId) {
          showError("Cihaz marka ID'si eksik");
          return Promise.reject(new Error("Cihaz marka ID'si eksik"));
        }

        await deviceManagementService.createDeviceModel({
          device_model_name: modelName.trim(),
          device_type_id: parseInt(typeId, 10),
          device_brand_id: parseInt(brandId, 10),
        });
        showSuccess("Yeni cihaz modeli eklendi.");
      }
      return Promise.resolve();
    } catch (error) {
      handleApiError(error);
      return Promise.reject(error);
    }
  };

  // Delete functions
  const handleDeleteBrand = async (id) => {
    if (window.confirm("Bu marka ve ilişkili tüm cihaz türlerini ve modellerini silmek istediğinizden emin misiniz?")) {
      try {
        await deviceManagementService.deleteDeviceBrand(id);
        showSuccess("Marka başarıyla silindi.");
        loadBrands(); // Refresh brands after deletion
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  const handleDeleteType = async (id) => {
    if (window.confirm("Bu cihaz türünü ve ilişkili tüm modelleri silmek istediğinizden emin misiniz?")) {
      try {
        await deviceManagementService.deleteDeviceType(id);
        showSuccess("Cihaz türü başarıyla silindi.");

        if (selectedBrand) {
          loadBrandDetails(selectedBrand.device_brand_id); // Refresh types after deletion
        }
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  const handleDeleteModel = async (id) => {
    if (window.confirm("Bu cihaz modelini silmek istediğinizden emin misiniz?")) {
      try {
        await deviceManagementService.deleteDeviceModel(id);
        showSuccess("Cihaz modeli başarıyla silindi.");

        if (selectedType) {
          loadTypeDetails(selectedType.device_type_id); // Refresh models after deletion
        }
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  // Page title and actions based on current view
  const getPageTitle = () => {
    if (currentView === "brands") {
      return "Cihaz Markaları";
    } else if (currentView === "types") {
      return selectedBrand.device_brand_name;
    } else if (currentView === "models") {
      return selectedType.device_type_name;
    }
    return "Cihaz Yönetimi";
  };

  const getModalTitle = () => {
    const action = isEditing ? "Düzenle" : "Ekle";

    if (modalMode === "brand") {
      return `Cihaz Markası ${action}`;
    } else if (modalMode === "type") {
      return `Cihaz Türü ${action}`;
    } else if (modalMode === "model") {
      return `Cihaz Modeli ${action}`;
    }

    return "Öğeyi Düzenle";
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
    return <div className="text-center p-5">Yükleniyor...</div>;
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Breadcrumb & Header */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4">
              {currentView === "brands" ? (
                "Cihaz Yönetimi"
              ) : currentView === "types" ? (
                <>
                  <span className="text-muted fw-light" onClick={navigateToBrands} style={{ cursor: "pointer" }}>
                    Cihaz Yönetimi /
                  </span>{" "}
                  {selectedBrand && `${selectedBrand.device_brand_name}`}
                </>
              ) : (
                <>
                  <span className="text-muted fw-light" onClick={navigateToBrands} style={{ cursor: "pointer" }}>
                    Cihaz Yönetimi /
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
                <span className="d-none d-sm-inline-block">Marka Ekle</span>
              </button>
            )}

            {currentView === "types" && selectedBrand && (
              <>
                <button type="button" className="btn btn-primary me-2" onClick={() => openAddModal("type")}>
                  <i className="bx bx-plus me-0 me-sm-1"></i>
                  <span className="d-none d-sm-inline-block">Tür Ekle</span>
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={navigateToBrands}>
                  <i className="bx bx-arrow-back me-0 me-sm-1"></i>
                  <span className="d-none d-sm-inline-block">Markalara Geri Dön</span>
                </button>
              </>
            )}

            {currentView === "models" && selectedType && (
              <>
                <button type="button" className="btn btn-primary me-2" onClick={() => openAddModal("model")}>
                  <i className="bx bx-plus me-0 me-sm-1"></i>
                  <span className="d-none d-sm-inline-block">Model Ekle</span>
                </button>
                {selectedBrand && (
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigateToTypes(selectedBrand.device_brand_id)}>
                    <i className="bx bx-arrow-back me-0 me-sm-1"></i>
                    <span className="d-none d-sm-inline-block">Türlere Geri Dön</span>
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
                <input type="text" className="form-control" id="searchInput" placeholder="İsim veya ID ile ara" value={searchTerm} onChange={handleSearch} />
                <label htmlFor="searchInput">Ara</label>
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
          <div className="card-tools"></div>
        </div>
        <div className="table-responsive text-nowrap">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>{currentView === "brands" ? "Marka Adı" : currentView === "types" ? "Tür Adı" : "Model Adı"}</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    Kayıt bulunamadı
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
                          title={currentView === "brands" ? "Markayı Düzenle" : currentView === "types" ? "Türü Düzenle" : "Modeli Düzenle"}
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
                          title={currentView === "brands" ? "Markayı Sil" : currentView === "types" ? "Türü Sil" : "Modeli Sil"}
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
              Toplam {filteredItems.length} kayıt, {totalPages} sayfa
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
                    Cihaz Marka Adı
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
                      Cihaz Tür Adı
                    </label>
                    <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="typeName" value={typeName} onChange={handleTypeNameChange} />
                    {nameError && <div className="invalid-feedback">{nameError}</div>}
                  </div>
                  {!isEditing && selectedBrand && (
                    <div className="mb-3">
                      <label className="form-label">Marka</label>
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
                      Cihaz Model Adı
                    </label>
                    <input type="text" className={`form-control ${nameError ? "is-invalid" : ""}`} id="modelName" value={modelName} onChange={handleModelNameChange} />
                    {nameError && <div className="invalid-feedback">{nameError}</div>}
                  </div>
                  {!isEditing && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Marka</label>
                        <input type="text" className="form-control" value={selectedBrand?.device_brand_name || ""} disabled />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Cihaz Türü</label>
                        <input type="text" className="form-control" value={selectedType?.device_type_name || ""} disabled />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                İptal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveItem}>
                {isEditing ? "Güncelle" : "Kaydet"}
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
