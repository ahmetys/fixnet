import React, { useState, useEffect, useRef } from "react";
import * as deviceModelService from "../../services/deviceManagement.service";
import { useNotification } from "../../contexts/NotificationContext";

function DeviceModelSelector({ selectedDeviceModel, onDeviceModelSelect, selectedDeviceType, selectedDeviceBrand, showValidation = false }) {
  const [deviceModels, setDeviceModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [deviceModelSearchTerm, setDeviceModelSearchTerm] = useState("");
  const [showDeviceModelDropdown, setShowDeviceModelDropdown] = useState(false);
  const [deviceModelDropdownLocked, setDeviceModelDropdownLocked] = useState(false);

  const [showNewDeviceModelModal, setShowNewDeviceModelModal] = useState(false);
  const [newDeviceModel, setNewDeviceModel] = useState({
    device_model_name: "",
    device_type_id: "",
    device_brand_id: "",
  });

  const deviceModelInputRef = useRef(null);
  const { showSuccess, showError, handleApiError } = useNotification();

  // Hata gösterme durumunun kontrolü
  const validationError = showValidation && !selectedDeviceModel?.device_model_id;

  // Bağımlılıklar değiştiğinde arama terimini temizle
  useEffect(() => {
    // Cihaz türü seçilmediğinde veya değiştiğinde
    if (!selectedDeviceType?.device_type_id) {
      setDeviceModelSearchTerm("");
      setDeviceModelDropdownLocked(false);
    }
  }, [selectedDeviceType]);

  useEffect(() => {
    // Marka seçilmediğinde veya değiştiğinde
    if (!selectedDeviceBrand?.device_brand_id) {
      setDeviceModelSearchTerm("");
      setDeviceModelDropdownLocked(false);
    }
  }, [selectedDeviceBrand]);

  // Seçili model değiştiğinde input değerini güncelle
  useEffect(() => {
    if (selectedDeviceModel?.device_model_id && selectedDeviceModel?.device_model_name) {
      setDeviceModelSearchTerm(selectedDeviceModel.device_model_name);
      setDeviceModelDropdownLocked(true);
    } else if (!selectedDeviceModel?.device_model_id) {
      setDeviceModelSearchTerm("");
      setDeviceModelDropdownLocked(false);
    }
  }, [selectedDeviceModel]);

  // Cihaz modellerini getir
  useEffect(() => {
    const fetchDeviceModels = async () => {
      // Cihaz türü seçilmemişse modelleri temizle
      if (!selectedDeviceType?.device_type_id) {
        setDeviceModels([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await deviceModelService.getAllDeviceModelsByType(selectedDeviceType.device_type_id);
        setDeviceModels(data);
        setFetchError(null);

        // Seçili modelin varlığını kontrol et
        if (selectedDeviceModel?.device_model_id) {
          const modelExists = data.some((model) => model.device_model_id === selectedDeviceModel.device_model_id);
          if (!modelExists) {
            onDeviceModelSelect({
              device_model_id: "",
              device_model_name: "",
            });
            setDeviceModelSearchTerm("");
          }
        }
      } catch (err) {
        setFetchError("Cihaz modelleri yüklenirken hata oluştu");
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceModels();

    // Yeni model oluşturma state'ini güncelle
    if (selectedDeviceType?.device_type_id) {
      setNewDeviceModel((prev) => ({
        ...prev,
        device_type_id: selectedDeviceType.device_type_id,
        device_brand_id: selectedDeviceBrand?.device_brand_id || "",
      }));
    }
  }, [selectedDeviceType, selectedDeviceBrand, selectedDeviceModel, onDeviceModelSelect, handleApiError]);

  // Arama terimine göre filtreleme
  const filteredDeviceModels = deviceModelSearchTerm.length >= 1 ? deviceModels.filter((model) => model.device_model_name.toLowerCase().includes(deviceModelSearchTerm.toLowerCase())) : deviceModels;

  // Dropdown durumunu kontrol et
  useEffect(() => {
    // Arama terimi seçili model ile eşleşiyorsa dropdown'ı gösterme
    if (deviceModelDropdownLocked && deviceModelSearchTerm === selectedDeviceModel?.device_model_name) {
      setShowDeviceModelDropdown(false);
    }
  }, [deviceModelSearchTerm, deviceModelDropdownLocked, selectedDeviceModel]);

  // Dışarı tıklandığında dropdown'ı kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (deviceModelInputRef.current && !deviceModelInputRef.current.contains(event.target)) {
        setShowDeviceModelDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    // Cihaz türü seçilmemişse uyarı göster
    if (!selectedDeviceType?.device_type_id) {
      showError("Lütfen önce bir cihaz türü seçin");
      return;
    }

    setShowDeviceModelDropdown(true);
  };

  const handleDeviceModelSearchChange = (e) => {
    const value = e.target.value;
    setDeviceModelSearchTerm(value);

    // Cihaz türü seçilmişse dropdown'ı göster
    if (selectedDeviceType?.device_type_id) {
      setShowDeviceModelDropdown(true);
    }

    // Değer seçili model adından farklıysa kilidi kaldır
    if (value !== selectedDeviceModel?.device_model_name) {
      setDeviceModelDropdownLocked(false);
    }

    // Değer boşsa model seçimini temizle
    if (value === "") {
      onDeviceModelSelect({
        device_model_id: "",
        device_model_name: "",
      });
    }
  };

  const handleNewDeviceModelChange = (e) => {
    const { name, value } = e.target;
    setNewDeviceModel({
      ...newDeviceModel,
      [name]: value,
    });
  };

  const handleSaveNewDeviceModel = async () => {
    // Validasyon kontrolleri
    if (!newDeviceModel.device_model_name.trim()) {
      showError("Cihaz model adı boş olamaz");
      return;
    }

    if (!selectedDeviceType?.device_type_id) {
      showError("Lütfen önce bir cihaz türü seçin");
      return;
    }

    if (!selectedDeviceBrand?.device_brand_id) {
      showError("Cihaz marka bilgisi eksik");
      return;
    }

    try {
      // Aynı isimde model var mı kontrol et
      const existing = deviceModels.find((model) => model.device_model_name.toLowerCase() === newDeviceModel.device_model_name.toLowerCase());
      if (existing) {
        showError("Bu isimde bir cihaz modeli zaten mevcut");
        return;
      }

      // Tip ve Marka ID'lerini ekle
      const modelData = {
        ...newDeviceModel,
        device_type_id: parseInt(selectedDeviceType.device_type_id, 10),
        device_brand_id: parseInt(selectedDeviceBrand.device_brand_id, 10),
      };

      // Yeni model oluştur
      const createdModelId = await deviceModelService.createDeviceModel(modelData);
      const createdModel = await deviceModelService.getDeviceModelById(createdModelId);

      // Modeller listesini güncelle
      setDeviceModels([...deviceModels, createdModel]);

      // Yeni oluşturulan modeli seç
      onDeviceModelSelect({
        device_model_id: createdModel.device_model_id,
        device_model_name: createdModel.device_model_name,
      });

      // UI durumunu güncelle
      setDeviceModelSearchTerm(createdModel.device_model_name);
      setDeviceModelDropdownLocked(true);
      setShowDeviceModelDropdown(false);
      setShowNewDeviceModelModal(false);
      showSuccess("Yeni cihaz modeli başarıyla eklendi");

      // Formu sıfırla
      setNewDeviceModel({
        device_model_name: "",
        device_type_id: selectedDeviceType.device_type_id,
        device_brand_id: selectedDeviceBrand.device_brand_id,
      });
    } catch (err) {
      showError("Cihaz modeli oluşturulurken hata oluştu");
      handleApiError(err);
    }
  };

  return (
    <>
      <div className="form-floating form-floating-outline mb-4 position-relative" ref={deviceModelInputRef}>
        <input
          type="text"
          className={`form-control ${validationError ? "is-invalid" : ""}`}
          id="device-model-search"
          placeholder="Cihaz modeli ara..."
          value={deviceModelSearchTerm}
          onChange={handleDeviceModelSearchChange}
          onFocus={handleFocus}
          autoComplete="off"
          disabled={loading || !selectedDeviceType?.device_type_id}
        />
        <label htmlFor="device-model-search">
          Cihaz Modeli <span className="text-danger">*</span>
        </label>
        {validationError && <div className="invalid-feedback d-block">Cihaz modeli seçimi zorunludur</div>}
        {!selectedDeviceType?.device_type_id && <div className="text-muted small mt-1">Lütfen önce bir cihaz türü seçin</div>}

        {/* Hata mesajı */}
        {fetchError && <div className="text-danger small mt-1">{fetchError}</div>}

        {/* Yükleniyor göstergesi */}
        {loading && (
          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </div>
        )}

        {/* Cihaz Model dropdown */}
        {showDeviceModelDropdown && !loading && selectedDeviceType?.device_type_id && (
          <div
            className="dropdown-menu d-block position-absolute w-100 overflow-auto"
            style={{
              zIndex: 1000,
              maxHeight: "200px",
            }}
          >
            {filteredDeviceModels.length > 0 ? (
              filteredDeviceModels.map((model) => (
                <a
                  key={model.device_model_id}
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeviceModelSelect({
                      device_model_id: model.device_model_id,
                      device_model_name: model.device_model_name,
                    });
                    setDeviceModelSearchTerm(model.device_model_name);
                    setDeviceModelDropdownLocked(true);
                    setShowDeviceModelDropdown(false);
                  }}
                >
                  {model.device_model_name}
                </a>
              ))
            ) : (
              <div className="dropdown-item-text text-center py-2">
                <div>Bu türe ait eşleşen cihaz modeli bulunamadı</div>
                <button
                  className="btn btn-sm btn-primary mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeviceModelDropdown(false);
                    setShowNewDeviceModelModal(true);
                    if (deviceModelSearchTerm) {
                      setNewDeviceModel((prev) => ({
                        ...prev,
                        device_model_name: deviceModelSearchTerm,
                        device_type_id: selectedDeviceType.device_type_id,
                        device_brand_id: selectedDeviceBrand?.device_brand_id,
                      }));
                    }
                  }}
                >
                  <i className="ri-add-line me-1"></i> Yeni Cihaz Modeli Ekle
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Yeni Cihaz Modeli Modalı */}
      {showNewDeviceModelModal && (
        <div
          className={`modal fade ${showNewDeviceModelModal ? "show" : ""}`}
          tabIndex="-1"
          aria-labelledby="newDeviceModelModalLabel"
          aria-hidden={!showNewDeviceModelModal}
          style={{ display: showNewDeviceModelModal ? "block" : "none", backgroundColor: showNewDeviceModelModal ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="newDeviceModelModalLabel">
                  {selectedDeviceType?.device_type_name} için Yeni Cihaz Modeli Ekle
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowNewDeviceModelModal(false)} aria-label="Kapat"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="device_model_name" className="form-label">
                    Cihaz Model Adı
                  </label>
                  <input type="text" className="form-control" id="device_model_name" name="device_model_name" value={newDeviceModel.device_model_name} onChange={handleNewDeviceModelChange} autoFocus />
                </div>
                <div className="mb-3">
                  <label className="form-label">Cihaz Türü</label>
                  <input type="text" className="form-control" value={selectedDeviceType?.device_type_name || ""} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Marka</label>
                  <input type="text" className="form-control" value={selectedDeviceBrand?.device_brand_name || ""} disabled />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNewDeviceModelModal(false)}>
                  İptal
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveNewDeviceModel}>
                  Cihaz Modelini Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeviceModelSelector;
