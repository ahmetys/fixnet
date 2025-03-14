import React from "react";

function LoadingSpinner() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Yükleniyor...</span>
      </div>
      <p className="mt-3">Veriler yükleniyor...</p>
    </div>
  );
}

export default LoadingSpinner;
