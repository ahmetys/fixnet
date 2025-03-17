import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { verifyResetToken, resetPassword } from "../services/auth.service";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Token doğrulama
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await verifyResetToken(token);
        if (response.success) {
          setIsTokenValid(true);
        } else {
          showError("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş");
        }
      } catch (error) {
        console.error("Token doğrulama hatası:", error);
        showError("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş");
      } finally {
        setIsTokenChecking(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setIsTokenChecking(false);
      setIsTokenValid(false);
    }
  }, [token, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Doğrulama kontrolleri
    if (!password) {
      showError("Lütfen yeni şifrenizi girin");
      return;
    }

    if (password.length < 6) {
      showError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    if (password !== confirmPassword) {
      showError("Şifreler eşleşmiyor");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await resetPassword(token, password);

      if (response.success) {
        setIsSuccess(true);
        showSuccess("Şifreniz başarıyla güncellendi");
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

  const redirectToLogin = () => {
    navigate("/login");
  };

  if (isTokenChecking) {
    return (
      <div className="container-xxl">
        <div className="authentication-wrapper authentication-basic container-p-y">
          <div className="authentication-inner py-4">
            <div className="card">
              <div className="card-body text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="mt-3">Şifre sıfırlama bağlantısı doğrulanıyor...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

              <h4 className="mb-1 pt-2">Şifre Sıfırlama 🔒</h4>

              {!isTokenValid ? (
                <div className="alert alert-danger mt-4" role="alert">
                  <div className="d-flex">
                    <i className="ri-error-warning-line me-2 fs-4"></i>
                    <div>
                      <h6 className="alert-heading mb-1">Geçersiz Bağlantı</h6>
                      <span>Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebinde bulunun.</span>
                      <div className="mt-3">
                        <Link to="/forgot-password" className="btn btn-primary">
                          Şifremi Unuttum
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isSuccess ? (
                <div className="alert alert-success mt-4" role="alert">
                  <div className="d-flex">
                    <i className="ri-check-line me-2 fs-4"></i>
                    <div>
                      <h6 className="alert-heading mb-1">Şifre Sıfırlama Başarılı!</h6>
                      <span>Şifreniz başarıyla güncellendi. Şimdi yeni şifrenizle giriş yapabilirsiniz.</span>
                      <div className="mt-3">
                        <button className="btn btn-primary" onClick={redirectToLogin}>
                          Giriş Yap
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-4">Lütfen yeni şifrenizi girin</p>
                  <form id="formResetPassword" className="mb-3" onSubmit={handleSubmit}>
                    <div className="mb-3 form-password-toggle">
                      <label className="form-label" htmlFor="password">
                        Yeni Şifre
                      </label>
                      <div className="input-group input-group-merge">
                        <input type="password" id="password" className="form-control" name="password" placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;" aria-describedby="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <span className="input-group-text cursor-pointer">
                          <i className="ri-eye-off-line"></i>
                        </span>
                      </div>
                    </div>
                    <div className="mb-3 form-password-toggle">
                      <label className="form-label" htmlFor="confirm-password">
                        Şifreyi Onayla
                      </label>
                      <div className="input-group input-group-merge">
                        <input
                          type="password"
                          id="confirm-password"
                          className="form-control"
                          name="confirm-password"
                          placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                          aria-describedby="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <span className="input-group-text cursor-pointer">
                          <i className="ri-eye-off-line"></i>
                        </span>
                      </div>
                    </div>
                    <button className="btn btn-primary d-grid w-100 mb-3" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          İşleniyor...
                        </>
                      ) : (
                        "Şifreyi Sıfırla"
                      )}
                    </button>
                    <div className="text-center">
                      <Link to="/login" className="d-flex align-items-center justify-content-center">
                        <i className="ri-arrow-left-s-line me-1"></i>
                        Giriş sayfasına dön
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
