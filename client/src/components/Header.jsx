import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  return (
    <nav className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme" id="layout-navbar">
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-6" href="#" onClick={toggleSidebar}>
          <i className="ri-menu-fill ri-24px"></i>
        </a>
      </div>

      <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <button className="nav-link dropdown-toggle hide-arrow p-0" data-bs-toggle="dropdown">
              <div className="avatar avatar-online">
                <img src="/src/assets/img/avatars/1.png" className="w-px-40 h-auto rounded-circle" />
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end mt-3 py-2">
              <li>
                <a className="dropdown-item" href="#">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 me-2">
                      <div className="avatar avatar-online">
                        <img src="/src/assets/img/avatars/1.png" className="w-px-40 h-auto rounded-circle" />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0 small">{user?.user_name || "Kullanıcı"}</h6>
                      <small className="text-muted"> {user?.user_role || "Kullanıcı"} </small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <div className="d-grid px-4 pt-2 pb-1">
                  <button onClick={handleLogout} className="btn btn-danger d-flex">
                    <small className="align-middle">Çıkış Yap</small>
                    <i className="ri-logout-box-r-line ms-2 ri-16px"></i>
                  </button>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Header;
