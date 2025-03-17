import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path ? "active" : "";
    }
    return location.pathname.startsWith(path) ? "active" : "";
  };

  return (
    <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme">
      <div className="app-brand demo">
        <Link to="/" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img src="../../src/assets/img/fixnet.png" width={60} height={60} alt="logo" className="app-brand-logo" />
          </span>
          <span className="app-brand-text demo menu-text fw-bold ms-2">FIXNET</span>
        </Link>
        <a href="javascript:void(0);" className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none">
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        <li className={`menu-item ${isActive("/")}`}>
          <Link
            to="/"
            className="menu-link"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <i className="menu-icon ri-dashboard-line"></i>
            <div data-i18n="Dashboard">Anasayfa</div>
          </Link>
        </li>
        <li className={`menu-item ${isActive("/tickets")}`}>
          <Link
            to="/tickets"
            className="menu-link"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <i className="menu-icon ri-ticket-2-line"></i>
            <div data-i18n="Tickets">Servis Fişleri</div>
          </Link>
        </li>
        <li className={`menu-item ${isActive("/customers")}`}>
          <Link
            to="/customers"
            className="menu-link"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <i className="menu-icon ri-user-line"></i>
            <div data-i18n="Customers">Müşteriler</div>
          </Link>
        </li>
        <li className={`menu-item ${isActive("/deviceManagement")}`}>
          <Link
            to="/deviceManagement"
            className="menu-link"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <i className="menu-icon ri-smartphone-line"></i>
            <div data-i18n="Device Management">Cihaz Yönetimi</div>
          </Link>
        </li>
        <li className={`menu-item ${isActive("/operations")}`}>
          <Link
            to="/operations"
            className="menu-link"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <i className="menu-icon ri-tools-line"></i>
            <div data-i18n="Operations">Servis İşlemleri</div>
          </Link>
        </li>
        {/* <li className={`menu-item ${isActive("/reports")}`}>
          <Link
            to="/reports"
            className="menu-link"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <i className="menu-icon ri-line-chart-line"></i>
            <div data-i18n="Reports">Raporlar</div>
          </Link>
        </li> */}
        <li className={`menu-item ${isActive("/settings")}`}>
          <Link
            to="/settings"
            className="menu-link"
            onClick={() => {
              toggleSidebar();
            }}
          >
            <i className="menu-icon ri-settings-line"></i>
            <div data-i18n="Settings">Ayarlar</div>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
