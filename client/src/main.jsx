import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "jquery";
import "@popperjs/core";
import "bootstrap";
import "./assets/vendor/js/helpers.js";
import "./assets/js/config.js";
import "node-waves";
import "perfect-scrollbar";
import "./assets/vendor/js/menu.js";
import "apexcharts";
import "./assets/js/main.js";
import "./assets/js/dashboards-analytics.js";
import "./assets/vendor/fonts/remixicon/remixicon.css";
import "./assets/vendor/libs/node-waves/node-waves.css";
import "./assets/vendor/css/core.css";
import "./assets/vendor/css/theme-default.css";
import "./assets/css/demo.css";
import "./assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.css";
import "./assets/vendor/libs/apex-charts/apex-charts.css";
import "./assets/vendor/css/pages/page-auth.css";
import "./assets/js/config.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
