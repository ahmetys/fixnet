import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function Layout1() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`layout-wrapper layout-content-navbar ${isOpen ? "layout-menu-expanded" : ""}`}>
      <div className="layout-container">
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        <div className="layout-page">
          <Header isOpen={isOpen} toggleSidebar={toggleSidebar} />
          <div className="content-wrapper">
            <div className="container-xxl flex-grow-1 container-p-y">
              <Outlet />
            </div>
            <footer className="content-footer footer bg-footer-theme">
              <div className="container-xxl">
                <div className="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
                  <div className="text-body mb-2 mb-md-0">
                    ©<script>document.write(new Date().getFullYear());</script>, made with{" "}
                    <span className="text-danger">
                      <i className="tf-icons ri-heart-fill"></i>
                    </span>{" "}
                    by
                    <a href="https://themeselection.com" target="_blank" className="footer-link">
                      ThemeSelection
                    </a>
                  </div>
                  <div className="d-none d-lg-inline-block">
                    <a href="https://themeselection.com/license/" className="footer-link me-4" target="_blank">
                      License
                    </a>
                    <a href="https://themeselection.com/" target="_blank" className="footer-link me-4">
                      More Themes
                    </a>

                    <a href="https://demos.themeselection.com/materio-bootstrap-html-admin-template/documentation/" target="_blank" className="footer-link me-4">
                      Documentation
                    </a>

                    <a href="https://github.com/themeselection/materio-bootstrap-html-admin-template-free/issues" target="_blank" className="footer-link">
                      Support
                    </a>
                  </div>
                </div>
              </div>
            </footer>
            <div className="content-backdrop fade"></div>
          </div>
        </div>
      </div>
      <div onClick={toggleSidebar} className="layout-overlay layout-menu-toggle"></div>
    </div>
  );
}

export default Layout1;
