import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/auth.service";
import { useNotification } from "../contexts/NotificationContext";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showError("Lütfen e-posta adresinizi girin");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await forgotPassword(email);
      console.log(response);

      if (response.success) {
        setIsEmailSent(true);
        showSuccess("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi");
      }
    } catch (error) {
      console.error("Şifre sıfırlama hatası:", error);

      if (error.response && error.response.data && error.response.data.message) {
        showError(error.response.data.message);
      } else {
        showError("Şifre sıfırlama işlemi sırasında bir hata oluştu");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner py-4">
          <div className="card">
            <div className="card-body">
              {/* Logo */}
              <div className="app-brand justify-content-center mb-4 mt-2">
                <a href="/" className="app-brand-link gap-2">
                  <span className="app-brand-logo demo">
                    <i className="ri-tools-fill text-primary" style={{ fontSize: "28px" }}></i>
                  </span>
                  <span className="app-brand-text demo text-body fw-bold ms-1">FIXNET</span>
                </a>
              </div>

              <h4 className="mb-1 pt-2">Şifrenizi mi unuttunuz? 🔒</h4>
              <p className="mb-4">E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim</p>

              {isEmailSent ? (
                <div className="alert alert-success" role="alert">
                  <div className="d-flex">
                    <i className="ri-check-line me-2 fs-4"></i>
                    <div>
                      <h6 className="alert-heading mb-1">E-posta Gönderildi!</h6>
                      <span>
                        Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi. Lütfen e-postanızı kontrol edin ve bağlantıya tıklayarak şifrenizi sıfırlayın.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      E-posta
                    </label>
                    <input type="text" className="form-control" id="email" name="email" placeholder="E-posta adresinizi girin" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                  </div>
                  <div className="mb-3">
                    <button className="btn btn-primary d-grid w-100" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          İşleniyor...
                        </>
                      ) : (
                        "Sıfırlama Bağlantısı Gönder"
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center">
                <Link to="/login" className="d-flex align-items-center justify-content-center">
                  <i className="ri-arrow-left-s-line me-1"></i>
                  Giriş sayfasına dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
