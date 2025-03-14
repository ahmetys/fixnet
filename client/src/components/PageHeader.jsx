import React from "react";

function PageHeader({ title, subtitle, icon }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <i className={`fas fa-${icon} me-2`}></i>
    </div>
  );
}

export default PageHeader;
