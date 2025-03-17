import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function Layout() {
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
            <div className="content-backdrop fade"></div>
          </div>
        </div>
      </div>
      <div onClick={toggleSidebar} className="layout-overlay layout-menu-toggle"></div>
    </div>
  );
}

export default Layout;
