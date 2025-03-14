import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value.trim(),
    }));
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      tempErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        console.log("Submitting credentials:", formData); // Debug için
        const success = await login(formData);
        console.log("Login success:", success); // Debug için
        if (success) {
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        }
      } catch (error) {
        console.error("Login error:", error);
        setErrors({
          submit: error.message || "An error occurred during login",
        });
      }
    }
  };

  return (
    <div className="position-relative">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner py-6 mx-4">
          {/* Login */}
          <div className="card p-7">
            {/* Logo */}
            <div className="app-brand justify-content-center mt-5">
              <a href="index.html" className="app-brand-link gap-3">
                <span className="app-brand-logo demo">
                  <img src="/src/assets/img/fixnet.png" alt="Logo" style={{ width: "50px", height: "50px" }} />
                </span>
                <span className="app-brand-text demo text-heading fw-semibold">FixNet</span>
              </a>
            </div>
            {/* /Logo */}

            <div className="card-body mt-1">
              <h4 className="mb-1">Welcome to FixNet! 👋🏻</h4>
              <p className="mb-5">Please sign-in to your account and start the adventure</p>

              <form id="formAuthentication" className="mb-5" onSubmit={handleSubmit}>
                <div className="form-floating form-floating-outline mb-5">
                  <input id="email" name="email" type="email" autoComplete="email" required className="form-control" placeholder="Email address" value={formData.email} onChange={handleChange} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  <label htmlFor="email">Email or Username</label>
                </div>
                <div className="mb-5">
                  <div className="form-password-toggle">
                    <div className="input-group input-group-merge">
                      <div className="form-floating form-floating-outline">
                        <input id="password" name="password" type="password" autoComplete="current-password" required className="form-control" placeholder="Password" value={formData.password} onChange={handleChange} />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        <label htmlFor="password">Password</label>
                      </div>
                      <span className="input-group-text cursor-pointer">
                        <i className="ri-eye-off-line ri-20px"></i>
                      </span>
                    </div>
                  </div>
                  {errors.submit && <div className="text-red-500 text-sm text-center">{errors.submit}</div>}
                </div>
                <div className="mb-5 pb-2 d-flex justify-content-between pt-2 align-items-center">
                  <div className="form-check mb-0">
                    <input className="form-check-input" type="checkbox" id="remember-me" />
                    <label className="form-check-label" htmlFor="remember-me">
                      {" "}
                      Remember Me{" "}
                    </label>
                  </div>
                  <a href="auth-forgot-password-basic.html" className="float-end mb-1">
                    <span>Forgot Password?</span>
                  </a>
                </div>
                <div className="mb-5">
                  <button className="btn btn-primary d-grid w-100" type="submit">
                    login
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
