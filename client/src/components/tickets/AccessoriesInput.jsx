function AccessoriesInput({ formData, handleChange }) {
  return (
    <div className="form-floating form-floating-outline mb-4">
      <input type="text" name="ticket_accessories" value={formData.ticket_accessories} onChange={handleChange} className="form-control" id="ticket_accessories" placeholder="Enter device accessories" autoComplete="off" />
      <label htmlFor="ticket_accessories">Accessories</label>
    </div>
  );
}

export default AccessoriesInput;
