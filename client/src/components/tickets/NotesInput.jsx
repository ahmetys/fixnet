import React, { useState, useEffect } from "react";
const predefinedMessages = ["Parca geldiginde müsteri aranacak", "Cihaz teslim alindi", "Cihaz teslim alinmadi", "Garanti kapsaminda onarilacak"];

function NotesInput({ formData, handleChange }) {
  // Hazır mesaj şablonları

  // Hangi tagların seçili olduğunu takip eden state
  const [selectedTags, setSelectedTags] = useState([]);

  // formData.ticket_notes değiştiğinde seçili tagları güncelle
  useEffect(() => {
    const currentText = formData.ticket_notes || "";
    // Metni - işaretlerine göre parçalara ayır
    const parts = currentText.split(" - ").map((part) => part.trim());

    // Hangi tagların mevcut olduğunu kontrol et
    const tagsInText = predefinedMessages.filter((message) => parts.some((part) => part === message));

    setSelectedTags(tagsInText);
  }, [formData.ticket_notes]);

  const handleTagClick = (message) => {
    // Tag zaten seçili mi kontrol et
    const isTagSelected = selectedTags.includes(message);

    if (isTagSelected) {
      // Tag zaten seçiliyse, metinden çıkar
      const currentText = formData.ticket_notes || "";

      // Metni parçalara ayır
      let parts = currentText.split(" - ").map((part) => part.trim());

      // Bu mesajı içeren kısmı filtrele
      parts = parts.filter((part) => part !== message);

      // Parçaları tekrar birleştir
      const newText = parts.join(" - ");

      handleChange({
        target: {
          name: "ticket_notes",
          value: newText,
        },
      });
    } else {
      // Tag seçili değilse, metne ekle
      const currentText = formData.ticket_notes || "";

      // Boş mesaj veya son karakter zaten - ise doğrudan ekle
      if (currentText === "" || currentText.trim().endsWith("-")) {
        handleChange({
          target: {
            name: "ticket_notes",
            value: currentText.trim() === "" ? message : `${currentText.trim()} ${message}`,
          },
        });
      } else {
        // Değilse - ile ayırarak ekle
        handleChange({
          target: {
            name: "ticket_notes",
            value: `${currentText.trim()} - ${message}`,
          },
        });
      }
    }
  };

  return (
    <div className="row mb-4">
      <div className="col-md-8">
        {" "}
        <div className="form-floating form-floating-outline mb-4">
          <textarea name="ticket_notes" value={formData.ticket_notes || ""} onChange={handleChange} className="form-control" id="ticket_notes" placeholder="Enter any notes about the ticket" style={{ height: "120px" }}></textarea>
          <label htmlFor="ticket_notes">Notes</label>
        </div>
      </div>
      <div className="col-md-4 mb-4">
        <div>
          <div className="d-flex flex-wrap gap-1">
            {predefinedMessages.map((message, index) => {
              const isSelected = selectedTags.includes(message);
              return (
                <button key={index} type="button" className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline-primary"}`} onClick={() => handleTagClick(message)}>
                  {message}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesInput;
