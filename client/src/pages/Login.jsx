import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { useLocation } from "react-router-dom";
function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { handleApiError } = useNotification();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value.trim(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await login(formData);
      if (success) {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className="position-relative">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner py-6 mx-4">
          <div className="card p-7">
            <div className="app-brand justify-content-center mt-5">
              <a href="index.html" className="app-brand-link gap-3">
                <span className="app-brand-logo demo">
                  <img src="/src/assets/img/fixnet.png" alt="Logo" style={{ width: "50px", height: "50px" }} />
                </span>
                <span className="app-brand-text demo text-heading fw-semibold">FIXNET</span>
              </a>
            </div>
            <div className="card-body mt-1">
              <h4 className="mb-1">FIXNET'e Hoş Geldiniz 👋🏻</h4>
              <p className="mb-5">Lütfen giriş yapınız</p>
              <form id="formAuthentication" className="mb-5" onSubmit={handleSubmit}>
                <div className="form-floating form-floating-outline mb-5">
                  <input id="email" name="email" type="email" autoComplete="email" required className="form-control" placeholder="Email address" value={formData.email} onChange={handleChange} />
                  <label htmlFor="email">Email yada Kullanıcı Adı</label>
                </div>
                <div className="mb-5">
                  <div className="form-password-toggle">
                    <div className="input-group input-group-merge">
                      <div className="form-floating form-floating-outline">
                        <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="form-control" placeholder="Password" value={formData.password} onChange={handleChange} />
                        <label htmlFor="password">Şifre</label>
                      </div>
                      <span className="input-group-text cursor-pointer" onClick={handleShowPassword}>
                        <i className="ri-eye-off-line ri-20px"></i>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mb-5 pb-2 d-flex justify-content-between pt-2 align-items-center">
                  <div className="form-check mb-0">
                    <input className="form-check-input" type="checkbox" id="remember-me" />
                    <label className="form-check-label" htmlFor="remember-me">
                      Beni Hatırla
                    </label>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-end">
                      <Link to="/forgot-password" className="text-primary">
                        <small>Şifrenizi mi unuttunuz?</small>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mb-5">
                  <button className="btn btn-primary d-grid w-100" type="submit">
                    Giriş Yap
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* /Login */}
          <img src="/src/assets/img/illustrations/tree-3.png" alt="auth-tree" className="authentication-image-object-left d-none d-lg-block" />
          <img src="/src/assets/img/illustrations/auth-basic-mask-light.png" className="authentication-image d-none d-lg-block" height="172" alt="triangle-bg" data-app-light-img="illustrations/auth-basic-mask-light.png" data-app-dark-img="illustrations/auth-basic-mask-dark.png" />
          <img src="/src/assets/img/illustrations/tree.png" alt="auth-tree" className="authentication-image-object-right d-none d-lg-block" />
        </div>
      </div>
    </div>
  );
}

export default Login;
