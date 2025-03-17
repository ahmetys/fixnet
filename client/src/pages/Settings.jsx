import React, { useState, useEffect } from "react";
import { useNotification } from "../contexts/NotificationContext";
import { getSettings, updateSettings } from "../services/settings.service.js";
const Settings = () => {
  const { showSuccess, handleApiError } = useNotification();

  const [storeData, setStoreData] = useState({
    store_name: "",
    store_phone: "",
    store_email: "",
    store_address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const response = await getSettings();
        setStoreData(response);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStoreData({
      ...storeData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const updated = await updateSettings(storeData);
      if (updated) {
        showSuccess("Mağaza bilgileri başarıyla güncellendi!");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <h4 className="fw-bold py-3 mb-4">Mağaza Bilgileri</h4>

      <div className="row">
        <div className="col-md-12">
          <div className="card mb-4">
            <h5 className="card-header">Mağaza Bilgileri</h5>

            <div className="card-body">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label" htmlFor="store_name">
                      Mağaza Adı
                    </label>
                    <div className="col-sm-10">
                      <div className="input-group input-group-merge">
                        <span className="input-group-text">
                          <i className="ri-store-2-line"></i>
                        </span>
                        <input type="text" className="form-control" id="store_name" name="store_name" placeholder="Store Name" value={storeData.store_name} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label" htmlFor="store_phone">
                      Telefon Numarası
                    </label>
                    <div className="col-sm-10">
                      <div className="input-group input-group-merge">
                        <span className="input-group-text">
                          <i className="ri-phone-line"></i>
                        </span>
                        <input type="text" className="form-control" id="store_phone" name="store_phone" placeholder="Phone Number" value={storeData.store_phone} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label" htmlFor="store_email">
                      Email
                    </label>
                    <div className="col-sm-10">
                      <div className="input-group input-group-merge">
                        <span className="input-group-text">
                          <i className="ri-mail-line"></i>
                        </span>
                        <input type="email" className="form-control" id="store_email" name="store_email" placeholder="Email Address" value={storeData.store_email} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <label className="col-sm-2 col-form-label" htmlFor="store_address">
                      Adres
                    </label>
                    <div className="col-sm-10">
                      <div className="input-group input-group-merge">
                        <span className="input-group-text">
                          <i className="ri-map-pin-line"></i>
                        </span>
                        <input type="text" className="form-control" id="store_address" name="store_address" placeholder="Store Address" value={storeData.store_address} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div className="row justify-content-end">
                    <div className="col-sm-10">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Kaydediliyor...
                          </>
                        ) : (
                          " Değişiklikleri Kaydet"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
