import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import * as ticketService from "../services/ticket.service.js";
import * as customerService from "../services/customer.service.js";
import * as operationService from "../services/operation.service.js";
import * as ticketLogService from "../services/ticketLog.service";
import { useNotification } from "../hooks/useNotification";
// Kullanılmayan servisleri kaldıralım veya yorum satırına alalım
// import * as deviceTypeService from "../services/deviceType.service.js";
// import * as deviceBrandService from "../services/deviceBrand.service.js";
// import * as deviceModelService from "../services/deviceModel.service.js";
// import * as operationService from "../services/operation.service.js";

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [availableOperations, setAvailableOperations] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState("");
  const [operationPrice, setOperationPrice] = useState("");
  const [advancePayment, setAdvancePayment] = useState(0);
  const [isEditingAdvance, setIsEditingAdvance] = useState(false);
  // Operasyon fiyatlarını geçici olarak saklamak için state
  const [editedPrices, setEditedPrices] = useState({});
  // Yedek parçalar için state
  const [spareParts, setSpareParts] = useState("");
  // Notes için state
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  // Notification hook'unu kullan
  const { showSuccess, showError, showNotification } = useNotification();

  // Güncellenmiş ve genişletilmiş status options
  const statusOptions = [
    { value: "pending", label: "Pending", color: "warning" },
    { value: "waiting_parts", label: "Waiting Parts", color: "info" },
    { value: "repaired", label: "Repaired", color: "success" },
    { value: "not_repaired", label: "Not Repaired", color: "danger" },
  ];

  // Format status text function
  const formatStatusText = (status) => {
    if (!status) return "Unknown";

    // Özel durum: waiting_parts -> Waiting Parts
    if (status === "waiting_parts") return "Waiting Parts";
    if (status === "not_repaired") return "Not Repaired";

    // Genel durum: alt çizgileri boşluklarla değiştir ve her kelimenin ilk harfini büyük yap
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get status object by value
  const getStatusObject = (statusValue) => {
    const foundStatus = statusOptions.find((s) => s.value === statusValue);
    if (foundStatus) return foundStatus;

    // Eğer önceden tanımlanmış bir durum bulunamazsa varsayılan bir nesne döndür
    return {
      value: statusValue,
      label: formatStatusText(statusValue),
      color: "secondary", // varsayılan renk
    };
  };
  const fetchTicketDetails = async () => {
    try {
      setLoading(true);

      // Fetch ticket data
      const ticketData = await ticketService.getTicketById(id);
      setTicket(ticketData);
      setAdvancePayment(parseFloat(ticketData.ticket_advance_pay || 0));
      // Yedek parçalar bilgisini ayarla
      setSpareParts(ticketData.ticket_spare_parts || "");
      // Notes bilgisini ayarla
      setNotes(ticketData.ticket_notes || "");

      // Operasyon fiyatlarını editedPrices state'ine başlangıç değeri olarak atayalım
      const initialPrices = {};
      if (ticketData.operations && ticketData.operations.length > 0) {
        ticketData.operations.forEach((op) => {
          initialPrices[op.ticket_operation_id] = op.ticket_operation_price;
        });
      }
      setEditedPrices(initialPrices);

      // Fetch customer data
      if (ticketData.customer_id) {
        const customerData = await customerService.getCustomerById(ticketData.customer_id);
        setCustomer(customerData);
      }

      // Fetch all available operations
      const operations = await operationService.getAllOperations();
      setAvailableOperations(operations);
    } catch (err) {
      showError("Failed to load ticket details. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTicketDetails();
  }, [id, showError]);

  // Bilet detayları yüklendiğinde log kayıtlarını çek
  useEffect(() => {
    if (ticket && ticket.ticket_id) {
      fetchTicketLogs();
    }
  }, [ticket]);

  const fetchTicketLogs = async () => {
    try {
      const data = await ticketLogService.getTicketLogs(ticket.ticket_id);
      setLogs(data);
    } catch (error) {
      console.error("Error fetching ticket logs:", error);
      showError("Log kayıtları yüklenirken bir hata oluştu");
    }
  };

  // Log oluşturma fonksiyonu
  const createLog = async (logType, description, details = {}) => {
    try {
      await ticketLogService.createTicketLog({
        ticket_id: ticket.ticket_id,
        user_id: null, // Aktif kullanıcı ID'si burada eklenebilir
        log_type: logType,
        log_description: description,
        log_details: details,
      });
      fetchTicketLogs(); // Log oluşturulduktan sonra güncel logları çek
    } catch (error) {
      console.error("Error creating log:", error);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      // Kullanıcı arayüzünü hemen güncelleyelim (optimistik UI yaklaşımı)
      setTicket({ ...ticket, ticket_status: newStatus });

      // API çağrısı
      const oldStatus = ticket.ticket_status;
      const result = await ticketService.updateTicket(id, {
        ticket_status: newStatus,
      });
      setTicket({
        ...ticket,
        ticket_status: newStatus,
      });
      showSuccess(`Bilet durumu başarıyla güncellendi: ${formatStatusText(newStatus)}`);

      // Log kaydı oluştur
      createLog("STATUS_UPDATE", `Bilet durumu "${formatStatusText(oldStatus)}" -> "${formatStatusText(newStatus)}" olarak güncellendi.`, { oldStatus, newStatus });
    } catch (error) {
      // Hata durumunda önceki değere geri dön
      setTicket({ ...ticket, ticket_status: ticket.ticket_status });
      showError("Bilet durumu güncellenirken bir hata oluştu");
      console.error(error);
    }
  };

  const handleDeleteTicket = async () => {
    if (window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      try {
        await ticketService.deleteTicket(id);
        navigate("/tickets", {
          state: {
            success: true,
            message: `Ticket #${id} has been deleted successfully.`,
          },
        });
      } catch (err) {
        showError("Failed to delete ticket. Please try again.");
        console.error(err);
      }
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Calculate total amount
  const calculateTotal = () => {
    if (!ticket?.operations || ticket.operations.length === 0) return 0;

    // Eğer düzenlenen fiyatlar varsa, onları kullan
    return ticket.operations.reduce((total, op) => {
      // Eğer bu operasyon için düzenlenmiş fiyat varsa, onu kullan
      const price = editedPrices[op.ticket_operation_id] !== undefined ? editedPrices[op.ticket_operation_id] : op.ticket_operation_price;

      return total + parseFloat(price || 0);
    }, 0);
  };

  // Calculate remaining balance
  const calculateRemainingBalance = () => {
    const total = calculateTotal();
    const advance = parseFloat(advancePayment || 0);
    return total - advance;
  };

  // Input değişikliğini yakalayan fonksiyon
  const handlePriceInputChange = (operationId, newPrice) => {
    // Yeni fiyatı editedPrices state'ine kaydet
    setEditedPrices((prev) => ({
      ...prev,
      [operationId]: newPrice,
    }));
  };

  // Fiyat güncelleme işlemi
  const handlePriceChange = async (operationId) => {
    try {
      const newPrice = editedPrices[operationId];
      if (!newPrice) {
        showError("Lütfen geçerli bir fiyat girin.");
        return;
      }

      const result = await ticketService.updateOperationPrice(operationId, newPrice);

      if (result.success) {
        // Operasyon bilgilerini güncellemek için bilet detaylarını yeniden çek
        await fetchTicketDetails();
        // Düzenleme modunu kapat
        setEditedPrices({
          ...editedPrices,
          [operationId]: undefined,
        });
        showSuccess("Operasyon fiyatı başarıyla güncellendi.");

        // Operasyon adını bul
        const operation = ticket.operations.find((op) => op.ticket_operation_id === operationId);
        const oldPrice = operation ? operation.ticket_operation_price : "bilinmeyen";
        const operationName = operation ? operation.operation_name : "Bilinmeyen Operasyon";

        // Log kaydı oluştur
        createLog("OPERATION_UPDATED", `"${operationName}" operasyonunun fiyatı ${oldPrice} ₺ -> ${newPrice} ₺ olarak güncellendi.`, {
          operationId,
          operationName,
          oldPrice,
          newPrice,
        });
      } else {
        showError("Operasyon fiyatı güncellenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error updating operation price:", error);
      showError("Operasyon fiyatı güncellenirken bir hata oluştu.");
    }
  };

  // Yeni operasyon ekleme işlemi
  const handleAddOperation = async () => {
    try {
      if (!selectedOperation || !operationPrice) {
        showError("Lütfen bir operasyon ve fiyat seçin.");
        return;
      }

      const result = await ticketService.addTicketOperation(ticket.ticket_id, selectedOperation, operationPrice);

      if (result.success) {
        // Yeni operasyonu almak için bilet detaylarını yeniden çek
        await fetchTicketDetails();
        // Form alanlarını sıfırla
        setSelectedOperation("");
        setOperationPrice("");
        showSuccess("Operasyon başarıyla eklendi.");

        // Operasyon adını bul
        const operation = availableOperations.find((op) => op.operation_id === parseInt(selectedOperation));
        const operationName = operation ? operation.operation_name : "Bilinmeyen Operasyon";

        // Log kaydı oluştur
        createLog("OPERATION_ADDED", `"${operationName}" operasyonu ${operationPrice} ₺ fiyatla eklendi.`, {
          operationId: selectedOperation,
          operationName,
          price: operationPrice,
        });
      } else {
        showError("Operasyon eklenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error adding operation:", error);
      showError("Operasyon eklenirken bir hata oluştu.");
    }
  };

  // Operasyon silme işlemi
  const handleDeleteOperation = async (operationId) => {
    try {
      // Eğer ticket'ta sadece 1 operasyon varsa, silme işlemini engelle
      if (ticket.operations && ticket.operations.length <= 1) {
        showError("Cannot delete the only operation. A ticket must have at least one operation.");
        return;
      }

      if (!window.confirm("Are you sure you want to remove this operation?")) {
        return;
      }

      // Silmeden önce operasyon bilgilerini kaydet
      const operation = ticket.operations.find((op) => op.ticket_operation_id === operationId);
      const operationName = operation ? operation.operation_name : "Bilinmeyen Operasyon";
      const operationPrice = operation ? operation.ticket_operation_price : "bilinmeyen";

      const result = await ticketService.deleteTicketOperation(operationId);
      console.log("result", result);
      if (result.success) {
        // Bilet operasyonlarını güncellemek için bilet detaylarını yeniden çek
        await fetchTicketDetails();
        showSuccess("Operasyon başarıyla silindi.");

        // Log kaydı oluştur
        createLog("OPERATION_DELETED", `"${operationName}" operasyonu silindi (Fiyat: ${operationPrice} ₺).`, {
          operationId,
          operationName,
          price: operationPrice,
        });
      } else {
        showError("Operasyon silinirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error deleting operation:", error);
      showError("Operasyon silinirken bir hata oluştu.");
    }
  };

  // Advance payment güncelleme işlemi
  const handleUpdateAdvancePayment = async () => {
    try {
      const oldAdvancePayment = ticket.ticket_advance_pay || 0;

      const result = await ticketService.updateTicket(id, {
        ticket_advance_pay: Number(advancePayment),
      });

      setTicket({
        ...ticket,
        ticket_advance_pay: Number(advancePayment),
      });
      setIsEditingAdvance(false);
      showSuccess("Avans ödemesi başarıyla güncellendi.");

      // Log kaydı oluştur
      createLog("PAYMENT_UPDATED", `Avans ödemesi ${oldAdvancePayment} ₺ -> ${advancePayment} ₺ olarak güncellendi.`, {
        oldAmount: oldAdvancePayment,
        newAmount: Number(advancePayment),
      });
    } catch (error) {
      console.error("Error updating advance payment:", error);
      showError("Avans ödemesi güncellenirken bir hata oluştu.");
    }
  };

  // Advance payment'ı sıfırlama işlemi
  const handleResetAdvancePayment = async () => {
    try {
      const oldAdvancePayment = ticket.ticket_advance_pay || 0;

      const result = await ticketService.updateTicket(id, {
        ticket_advance_pay: 0,
      });

      setTicket({
        ...ticket,
        ticket_advance_pay: 0,
      });
      setAdvancePayment(0);
      showSuccess("Avans ödemesi başarıyla sıfırlandı.");

      // Log kaydı oluştur
      createLog("PAYMENT_UPDATED", `Avans ödemesi ${oldAdvancePayment} ₺ -> 0 ₺ olarak sıfırlandı.`, {
        oldAmount: oldAdvancePayment,
        newAmount: 0,
      });
    } catch (error) {
      console.error("Error resetting advance payment:", error);
      showError("Avans ödemesi sıfırlanırken bir hata oluştu.");
    }
  };

  // Yedek parçaları güncelleme işlemi
  const handleUpdateSpareParts = async () => {
    try {
      const oldSpareParts = ticket.ticket_spare_parts || "";

      const result = await ticketService.updateTicket(id, {
        ticket_spare_parts: spareParts,
      });

      setTicket({
        ...ticket,
        ticket_spare_parts: spareParts,
      });
      showSuccess("Yedek parçalar başarıyla güncellendi.");

      // Log kaydı oluştur
      createLog("PARTS_UPDATED", `Yedek parçalar "${oldSpareParts}" -> "${spareParts}" olarak güncellendi.`, {
        oldSpareParts,
        newSpareParts: spareParts,
      });
    } catch (error) {
      console.error("Error updating spare parts:", error);
      showError("Yedek parçalar güncellenirken bir hata oluştu.");
    }
  };

  // Notes'u güncelleme işlemi
  const handleUpdateNotes = async () => {
    try {
      const oldNotes = ticket.ticket_notes || "";

      const result = await ticketService.updateTicket(id, {
        ticket_notes: notes,
      });

      setTicket({
        ...ticket,
        ticket_notes: notes,
      });
      showSuccess("Notlar başarıyla güncellendi.");

      // Log kaydı oluştur
      createLog("NOTES_UPDATED", `Bilet notları "${oldNotes}" -> "${notes}" olarak güncellendi.`, {
        oldNotes,
        newNotes: notes,
      });
    } catch (error) {
      console.error("Error updating notes:", error);
      showError("Notlar güncellenirken bir hata oluştu.");
    }
  };

  // Kullanılabilir operasyonların filtrelenmesi (zaten ticket'a eklenmiş olanları çıkar)
  const getFilteredOperations = () => {
    if (!ticket || !ticket.operations || !availableOperations.length) {
      return availableOperations;
    }

    // Ticket'a ait mevcut operasyon ID'lerini topla
    const existingOperationIds = ticket.operations.map((op) => op.operation_id.toString());

    // Mevcut olmayan operasyonları filtrele
    return availableOperations.filter((op) => !existingOperationIds.includes(op.operation_id.toString()));
  };

  // Mark as Delivered butonu için handler fonksiyonu ekleyelim
  const handleMarkAsDelivered = async () => {
    try {
      const result = await ticketService.markTicketDelivered(id);
      if (result.success) {
        setTicket({
          ...ticket,
          ticket_delivered: true,
        });
        showSuccess("Bilet başarıyla teslim edildi olarak işaretlendi.");

        // Log kaydı oluştur
        createLog("TICKET_DELIVERED", "Bilet teslim edildi olarak işaretlendi.", { ticketId: id });
      } else {
        showError("Bilet teslim edildi olarak işaretlenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error marking ticket as delivered:", error);
      showError("Bilet teslim edildi olarak işaretlenirken bir hata oluştu.");
    }
  };

  // Yazdırma fonksiyonu
  const handlePrint = () => {
    // Yeni bir pencere aç
    const printWindow = window.open("", "_blank", "width=800,height=600");

    // Yazdırma penceresinin HTML içeriğini oluştur
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bilet #${ticket.ticket_id} Detayları</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            width: 150px;
          }
          .info-value {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
          }
          .total-row {
            font-weight: bold;
          }
          @media print {
            .no-print {
              display: none;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Servis Talebi - #${ticket.ticket_id}</h2>
          <p>Oluşturma: ${formatDate(ticket.created_at)}</p>
          <p>Durum: ${formatStatusText(ticket.ticket_status)}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Müşteri Bilgileri</div>
          <div class="info-row">
            <div class="info-label">Müşteri Adı:</div>
            <div class="info-value">${ticket.customer_name || "N/A"}</div>
          </div>
          ${
            ticket.customer_company
              ? `
          <div class="info-row">
            <div class="info-label">Şirket:</div>
            <div class="info-value">${ticket.customer_company}</div>
          </div>`
              : ""
          }
          <div class="info-row">
            <div class="info-label">Telefon:</div>
            <div class="info-value">${ticket.customer_phone || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">E-posta:</div>
            <div class="info-value">${ticket.customer_email || "N/A"}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Cihaz Bilgileri</div>
          <div class="info-row">
            <div class="info-label">Marka:</div>
            <div class="info-value">${ticket.device_brand_name || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Cihaz Tipi:</div>
            <div class="info-value">${ticket.device_type_name || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Model:</div>
            <div class="info-value">${ticket.device_model_name || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Seri/IMEI:</div>
            <div class="info-value">${ticket.ticket_device_serial || "N/A"}</div>
          </div>
          ${
            ticket.ticket_accessories
              ? `
          <div class="info-row">
            <div class="info-label">Aksesuarlar:</div>
            <div class="info-value">${ticket.ticket_accessories}</div>
          </div>`
              : ""
          }
          ${
            ticket.ticket_spare_parts
              ? `
          <div class="info-row">
            <div class="info-label">Yedek Parçalar:</div>
            <div class="info-value">${ticket.ticket_spare_parts}</div>
          </div>`
              : ""
          }
        </div>

        <div class="section">
          <div class="section-title">Servis İşlemleri</div>
          <table>
            <thead>
              <tr>
                <th>İşlem</th>
                <th>Fiyat</th>
              </tr>
            </thead>
            <tbody>
              ${
                ticket.operations &&
                ticket.operations
                  .map(
                    (op) => `
                <tr>
                  <td>${op.operation_name || `İşlem #${op.operation_id}`}</td>
                  <td>€${parseFloat(op.ticket_operation_price).toFixed(2)}</td>
                </tr>
              `
                  )
                  .join("")
              }
              <tr class="total-row">
                <td>Toplam:</td>
                <td>€${calculateTotal().toFixed(2)}</td>
              </tr>
              <tr>
                <td>Avans Ödeme:</td>
                <td>€${parseFloat(ticket.ticket_advance_pay || 0).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>Kalan Bakiye:</td>
                <td>€${calculateRemainingBalance().toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${
          ticket.ticket_notes
            ? `
        <div class="section">
          <div class="section-title">Notlar</div>
          <p>${ticket.ticket_notes}</p>
        </div>`
            : ""
        }

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()">Yazdır</button>
          <button onclick="window.close()">Kapat</button>
        </div>
        <hr/>
        <div class="header">
          <h2>Servis Talebi - #${ticket.ticket_id}</h2>
          <p>Oluşturma: ${formatDate(ticket.created_at)}</p>
          <p>Durum: ${formatStatusText(ticket.ticket_status)}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Müşteri Bilgileri</div>
          <div class="info-row">
            <div class="info-label">Müşteri Adı:</div>
            <div class="info-value">${ticket.customer_name || "N/A"}</div>
          </div>
          ${
            ticket.customer_company
              ? `
          <div class="info-row">
            <div class="info-label">Şirket:</div>
            <div class="info-value">${ticket.customer_company}</div>
          </div>`
              : ""
          }
          <div class="info-row">
            <div class="info-label">Telefon:</div>
            <div class="info-value">${ticket.customer_phone || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">E-posta:</div>
            <div class="info-value">${ticket.customer_email || "N/A"}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Cihaz Bilgileri</div>
          <div class="info-row">
            <div class="info-label">Marka:</div>
            <div class="info-value">${ticket.device_brand_name || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Cihaz Tipi:</div>
            <div class="info-value">${ticket.device_type_name || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Model:</div>
            <div class="info-value">${ticket.device_model_name || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Seri/IMEI:</div>
            <div class="info-value">${ticket.ticket_device_serial || "N/A"}</div>
          </div>
          ${
            ticket.ticket_accessories
              ? `
          <div class="info-row">
            <div class="info-label">Aksesuarlar:</div>
            <div class="info-value">${ticket.ticket_accessories}</div>
          </div>`
              : ""
          }
          ${
            ticket.ticket_spare_parts
              ? `
          <div class="info-row">
            <div class="info-label">Yedek Parçalar:</div>
            <div class="info-value">${ticket.ticket_spare_parts}</div>
          </div>`
              : ""
          }
        </div>

        <div class="section">
          <div class="section-title">Servis İşlemleri</div>
          <table>
            <thead>
              <tr>
                <th>İşlem</th>
                <th>Fiyat</th>
              </tr>
            </thead>
            <tbody>
              ${
                ticket.operations &&
                ticket.operations
                  .map(
                    (op) => `
                <tr>
                  <td>${op.operation_name || `İşlem #${op.operation_id}`}</td>
                  <td>€${parseFloat(op.ticket_operation_price).toFixed(2)}</td>
                </tr>
              `
                  )
                  .join("")
              }
              <tr class="total-row">
                <td>Toplam:</td>
                <td>€${calculateTotal().toFixed(2)}</td>
              </tr>
              <tr>
                <td>Avans Ödeme:</td>
                <td>€${parseFloat(ticket.ticket_advance_pay || 0).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>Kalan Bakiye:</td>
                <td>€${calculateRemainingBalance().toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${
          ticket.ticket_notes
            ? `
        <div class="section">
          <div class="section-title">Notlar</div>
          <p>${ticket.ticket_notes}</p>
        </div>`
            : ""
        }

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()">Yazdır</button>
          <button onclick="window.close()">Kapat</button>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Belgenin yüklenmesi tamamlandığında yazdırma diyaloğunu aç
    printWindow.onload = function () {
      // Bazı tarayıcılarda birkaç milisaniye beklemek yazdırma işleminin daha güvenilir olmasını sağlar
      setTimeout(function () {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header and Buttons */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold py-3 mb-4">
              <span className="text-muted fw-light">Service / Tickets /</span> Ticket #{id}
            </h4>
          </div>
          <div>
            <button type="button" className="btn btn-outline-primary me-2" onClick={handlePrint}>
              <i className="bx bx-printer me-1"></i> Print
            </button>
            <Link to="/tickets" className="btn btn-outline-secondary me-2">
              <i className="bx bx-arrow-back me-1"></i> Back to Tickets
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading ticket details...</p>
        </div>
      ) : ticket ? (
        <>
          {/* Status Bar and Actions */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <span className="me-2">Durum:</span>
                <div className="dropdown">
                  <button
                    className={`btn btn-sm btn-outline-${getStatusObject(ticket.ticket_status).color} dropdown-toggle`}
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    disabled={ticket.ticket_delivered} // Teslim edilmiş biletler için düzenlemeyi engelle
                  >
                    {formatStatusText(ticket.ticket_status)}
                  </button>
                  <ul className="dropdown-menu">
                    {statusOptions.map((option) => (
                      <li key={option.value}>
                        <a
                          className={`dropdown-item ${ticket.ticket_status === option.value ? "active" : ""}`}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!ticket.ticket_delivered) {
                              handleUpdateStatus(option.value);
                            }
                          }}
                        >
                          <span className={`badge bg-${option.color} me-2`}></span>
                          {option.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h5 className="mb-3">Ticket Status</h5>
                  <div className="d-flex align-items-center">
                    <span className={`badge bg-${getStatusObject(ticket.ticket_status).color} me-2 p-2 fs-6`}>{getStatusObject(ticket.ticket_status).label}</span>
                  </div>
                </div>
                <div className="col-md-6 text-md-end">
                  <p className="mb-1">
                    <strong>Created:</strong> {formatDate(ticket.created_at)}
                  </p>
                  <p className="mb-0">
                    <strong>Last Updated:</strong> {formatDate(ticket.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer and Device Information */}
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between">
                  <h5 className="mb-0">Customer Information</h5>
                  {customer && (
                    <Link to={`/customers/${customer.customer_id}`} className="text-primary">
                      View Details
                    </Link>
                  )}
                </div>
                <div className="card-body">
                  {customer ? (
                    <>
                      <p>
                        <strong>Type:</strong> {ticket.customer_type}
                      </p>
                      <p>
                        <strong>Name:</strong> {ticket.customer_name}
                      </p>
                      {ticket.customer_company && (
                        <p>
                          <strong>Company:</strong> {ticket.customer_company}
                        </p>
                      )}
                      <p>
                        <strong>Phone:</strong> {ticket.customer_phone || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {ticket.customer_email || "N/A"}
                      </p>
                      <p>
                        <strong>Address:</strong> {ticket.customer_address || "N/A"}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">Customer information not available</p>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Device Information</h5>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Type:</strong> {ticket.device_type_name || "N/A"}
                  </p>
                  <p>
                    <strong>Brand:</strong> {ticket.device_brand_name || "N/A"}
                  </p>
                  <p>
                    <strong>Model:</strong> {ticket.device_model_name || "N/A"}
                  </p>
                  <p>
                    <strong>Serial/IMEI:</strong> {ticket.ticket_device_serial || "N/A"}
                  </p>
                  {ticket.ticket_accessories && (
                    <p>
                      <strong>Accessories:</strong> {ticket.ticket_accessories}
                    </p>
                  )}
                  {ticket.ticket_spare_parts && (
                    <p>
                      <strong>Spare Parts:</strong> {ticket.ticket_spare_parts || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              {/* Operations and Financial Information */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Service Operations</h5>
                </div>
                <div className="card-body">
                  {/* Yeni Operasyon Ekleme Formu */}
                  <div className="mb-4">
                    <label className="form-label">Add New Operation</label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <select className="form-select" value={selectedOperation} onChange={(e) => setSelectedOperation(e.target.value)} disabled={ticket.ticket_delivered}>
                          <option value="">Select an operation</option>
                          {getFilteredOperations().map((op) => (
                            <option key={op.operation_id} value={op.operation_id}>
                              {op.operation_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text">€</span>
                          <input type="number" className="form-control" placeholder="Price" min="0" step="0.01" value={operationPrice} onChange={(e) => setOperationPrice(e.target.value)} disabled={ticket.ticket_delivered} />
                          <button className="btn btn-primary waves-effect" type="button" title="Save" onClick={handleAddOperation} disabled={!selectedOperation || !operationPrice || ticket.ticket_delivered}>
                            <i className="ri-check-line"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operasyonlar Tablosu */}
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Operation</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticket.operations && ticket.operations.length > 0 ? (
                          <>
                            {ticket.operations.map((op, index) => (
                              <tr key={index}>
                                <td>{op.operation_name || `Operation #${op.operation_id}`}</td>
                                <td>
                                  <div className="input-group" style={{ minWidth: "240px" }}>
                                    <span className="input-group-text">€</span>
                                    <input
                                      className="form-control"
                                      min="0"
                                      step="0.01"
                                      type="number"
                                      value={editedPrices[op.ticket_operation_id] !== undefined ? editedPrices[op.ticket_operation_id] : op.ticket_operation_price}
                                      onChange={(e) => handlePriceInputChange(op.ticket_operation_id, e.target.value)}
                                      disabled={ticket.ticket_delivered}
                                    />
                                    <button className="btn btn-success waves-effect" type="button" onClick={() => handlePriceChange(op.ticket_operation_id)} title="Save" disabled={ticket.ticket_delivered}>
                                      <i className="ri-check-line"></i>
                                    </button>
                                    <button className="btn btn-danger waves-effect" type="button" onClick={() => handleDeleteOperation(op.ticket_operation_id)} title="Delete" disabled={ticket.ticket_delivered}>
                                      <i className="ri-delete-bin-line"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            <tr className="table-active">
                              <td className="text-end fw-bold">Total:</td>
                              <td className="fw-bold">€{calculateTotal().toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="text-end fw-bold text-danger">Advance Payment:</td>
                              <td>
                                <div className="input-group">
                                  <span className="input-group-text">€</span>
                                  <input className="form-control" min="0" step="0.01" type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} disabled={ticket.ticket_delivered} />
                                  <button className="btn btn-success waves-effect" type="button" onClick={handleUpdateAdvancePayment} title="Save" disabled={ticket.ticket_delivered}>
                                    <i className="ri-check-line"></i>
                                  </button>
                                  <button className="btn btn-warning waves-effect" type="button" onClick={handleResetAdvancePayment} title="Reset to Zero" disabled={ticket.ticket_delivered}>
                                    <i className="ri-restart-line"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="text-end fw-bold">Remaining Balance:</td>
                              <td className="fw-bold">€{calculateRemainingBalance().toFixed(2)}</td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td colSpan="2" className="text-center">
                              No operations added to this ticket
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              {/* Spare Parts Information */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Spare Parts</h5>
                </div>
                <div className="card-body">
                  <div className="input-group">
                    <input type="text" className="form-control" placeholder="Enter spare parts information" value={spareParts} onChange={(e) => setSpareParts(e.target.value)} disabled={ticket.ticket_delivered} />
                    <button className="btn btn-success waves-effect" type="button" onClick={handleUpdateSpareParts} title="Save" style={{ alignSelf: "stretch" }} disabled={ticket.ticket_delivered}>
                      <i className="ri-check-line"></i>
                    </button>
                  </div>
                </div>
              </div>
              {/* Notes */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Notes</h5>
                </div>
                <div className="card-body">
                  <div className="input-group mb-3">
                    <textarea className="form-control" rows="5" placeholder="Enter notes about this ticket" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ whiteSpace: "pre-line" }} disabled={ticket.ticket_delivered}></textarea>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-primary waves-effect" type="button" onClick={handleUpdateNotes} title="Save Notes" style={{ alignSelf: "stretch" }} disabled={ticket.ticket_delivered}>
                      Update
                    </button>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleMarkAsDelivered} disabled={ticket.ticket_delivered || (ticket.ticket_status !== "repaired" && ticket.ticket_status !== "not_repaired")}>
                <i className="fas fa-check-circle me-1"></i> Mark as Delivered
              </button>
            </div>
          </div>

          {/* Sayfanın en altına log tablosu ekleyelim */}
          <div className="card mt-4">
            <div className="card-header border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0">İşlem Geçmişi</h5>
              <button type="button" className="btn btn-sm btn-primary" onClick={fetchTicketLogs}>
                <i className="fas fa-sync-alt me-1"></i> Yenile
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover border-top">
                <thead>
                  <tr>
                    <th className="text-truncate">Tarih</th>
                    <th className="text-truncate">İşlem Türü</th>
                    <th className="text-truncate">Açıklama</th>
                    <th className="text-truncate">İşlem Yapan</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.log_id}>
                        <td className="text-truncate">{new Date(log.created_at).toLocaleString("tr-TR")}</td>
                        <td className="text-truncate">
                          {log.log_type === "STATUS_UPDATE" && <span className="badge bg-label-primary">Durum Değişikliği</span>}
                          {log.log_type === "TICKET_CREATED" && <span className="badge bg-label-success">Bilet Oluşturuldu</span>}
                          {log.log_type === "TICKET_DELIVERED" && <span className="badge bg-label-success">Teslim</span>}
                          {log.log_type === "OPERATION_ADDED" && <span className="badge bg-label-info">İşlem Eklendi</span>}
                          {log.log_type === "OPERATION_UPDATED" && <span className="badge bg-label-warning">İşlem Güncellendi</span>}
                          {log.log_type === "OPERATION_DELETED" && <span className="badge bg-label-danger">İşlem Silindi</span>}
                          {log.log_type === "PAYMENT_UPDATED" && <span className="badge bg-label-dark">Ödeme Güncellendi</span>}
                          {log.log_type === "PARTS_UPDATED" && <span className="badge bg-label-secondary">Parçalar Güncellendi</span>}
                          {log.log_type === "NOTES_UPDATED" && <span className="badge bg-label-info">Notlar Güncellendi</span>}
                        </td>
                        <td>{log.log_description}</td>
                        <td className="text-truncate">{log.username || "Sistem"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-3">
                        <div className="d-flex justify-content-center align-items-center flex-column">
                          <i className="fas fa-history text-muted mb-2" style={{ fontSize: "1.5rem" }}></i>
                          <p className="mb-0 text-muted">Henüz işlem kaydı bulunmamaktadır.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {logs.length > 0 && (
              <div className="card-footer border-top text-muted small">
                <div className="d-flex justify-content-between align-items-center">
                  <span>Toplam {logs.length} işlem kaydı bulunmaktadır.</span>
                  <span>Son güncelleme: {new Date().toLocaleString("tr-TR")}</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-5">
          <div className="mb-3">
            <i className="bx bx-error-circle bx-lg text-danger"></i>
          </div>
          <h5>Ticket Not Found</h5>
          <p className="text-muted">The ticket you are looking for does not exist or has been deleted.</p>
          <Link to="/tickets" className="btn btn-primary mt-3">
            Back to Tickets
          </Link>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
