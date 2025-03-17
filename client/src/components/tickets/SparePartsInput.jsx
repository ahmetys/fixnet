import React from "react";

function SparePartsInput({ formData, handleChange }) {
  return (
    <div className="form-floating form-floating-outline mb-4">
      <input type="text" className="form-control" id="spare-parts-name" name="ticket_spare_parts" value={formData.ticket_spare_parts} onChange={handleChange} placeholder="Yedek parça adını giriniz" autoComplete="off" />
      <label htmlFor="spare-parts-name">Yedek Parça</label>
    </div>
  );
}

export default SparePartsInput;
