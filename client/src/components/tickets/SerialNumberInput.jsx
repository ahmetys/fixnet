import React from "react";

function SerialNumberInput({ formData, handleChange }) {
  return (
    <div className="form-floating form-floating-outline mb-4">
      <input type="text" name="ticket_device_serial" value={formData.ticket_device_serial} onChange={handleChange} className="form-control" id="serial-number" placeholder="Enter serial number or IMEI" autoComplete="off" />
      <label htmlFor="serial-number">Serial Number / IMEI</label>
    </div>
  );
}

export default SerialNumberInput;
