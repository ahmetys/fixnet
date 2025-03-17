import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import * as ticketService from "../services/ticket.service.js";
import * as customerService from "../services/customer.service.js";
import * as operationService from "../services/operation.service.js";
import * as ticketLogService from "../services/ticketLog.service";
import { useNotification } from "../contexts/NotificationContext";

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

  // Orijinal değerleri takip etmek için state değişkenlerini ekleyelim
  const [originalSpareParts, setOriginalSpareParts] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");

  // Orijinal avans ödeme değerini takip etmek için state değişkeni
  const [originalAdvancePayment, setOriginalAdvancePayment] = useState(0);
  // Orijinal operasyon fiyatlarını takip etmek için state değişkeni
  const [originalPrices, setOriginalPrices] = useState({});

  const [loading, setLoading] = useState(true);
  // Notification hook'unu kullan
  const { showSuccess, showError, handleApiError } = useNotification();

  // Güncellenmiş ve genişletilmiş status options
  const statusOptions = [
    { value: "pending", label: "Beklemede", color: "warning" },
    { value: "waiting_parts", label: "Parça Bekliyor", color: "info" },
    { value: "repaired", label: "Onarıldı", color: "success" },
    { value: "not_repaired", label: "Onarılamadı", color: "danger" },
  ];

  // Format status text function
  const formatStatusText = (status) => {
    if (!status) return "Unknown";

    // Özel durum: waiting_parts -> Waiting Parts
    if (status === "pending") return "Beklemede";
    if (status === "waiting_parts") return "Parça Bekliyor";
    if (status === "repaired") return "Onarıldı";
    if (status === "not_repaired") return "Onarılamadı";

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

      // Avans ödeme değerini ayarla ve orijinal değeri kaydet
      const advancePaymentValue = parseFloat(ticketData.ticket_advance_pay || 0);
      setAdvancePayment(advancePaymentValue);
      setOriginalAdvancePayment(advancePaymentValue);

      // Yedek parçalar bilgisini ayarla
      const sparePartsValue = ticketData.ticket_spare_parts || "";
      setSpareParts(sparePartsValue);
      setOriginalSpareParts(sparePartsValue); // Orijinal değeri kaydet

      // Notes bilgisini ayarla
      const notesValue = ticketData.ticket_notes || "";
      setNotes(notesValue);
      setOriginalNotes(notesValue); // Orijinal değeri kaydet

      // Operasyon fiyatlarını editedPrices state'ine başlangıç değeri olarak atayalım
      const initialPrices = {};
      if (ticketData.operations && ticketData.operations.length > 0) {
        ticketData.operations.forEach((op) => {
          initialPrices[op.ticket_operation_id] = op.ticket_operation_price;
        });
      }
      setEditedPrices(initialPrices);
      setOriginalPrices({ ...initialPrices }); // Orijinal fiyatları da ayarla

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

  // Format date to readable format (dd.mm.yyyy hh:mm)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    // Gün, ay ve yıl değerlerini al
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    // Saat ve dakika değerlerini al
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    // "dd.mm.yyyy hh:mm" formatında birleştir
    return `${day}.${month}.${year} ${hours}:${minutes}`;
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
        // Operasyon bilgilerini yerel olarak güncelle, sayfayı yenilemeden
        const updatedOperations = ticket.operations.map((op) => {
          if (op.ticket_operation_id === operationId) {
            return {
              ...op,
              ticket_operation_price: parseFloat(newPrice),
            };
          }
          return op;
        });

        // Ticket state'ini güncelle
        setTicket({
          ...ticket,
          operations: updatedOperations,
        });

        // Başarılı güncelleme sonrası orijinal değerleri güncelle
        setOriginalPrices((prev) => ({
          ...prev,
          [operationId]: parseFloat(newPrice),
        }));

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
  const handleAddOperation = async (e) => {
    // Eğer bir form içindeyse ve sayfanın yenilenmesini önlemek istiyorsak
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Validasyon kontrolleri
    if (!selectedOperation || !operationPrice) {
      showError("Lütfen bir işlem ve fiyat giriniz");
      return;
    }

    try {
      // İşlem ekleme API çağrısı
      const result = await ticketService.addTicketOperation(ticket.ticket_id, selectedOperation, operationPrice);

      // Ticket verisini güncelleyelim
      // Eski operasyonlar + yeni eklenen operasyon
      const updatedOperations = [
        ...(ticket.operations || []),
        {
          ticket_operation_id: result.ticket_operation_id,
          operation_id: selectedOperation,
          operation_name: availableOperations.find((op) => op.operation_id === parseInt(selectedOperation, 10))?.operation_name,
          ticket_operation_price: parseFloat(operationPrice),
        },
      ];

      // Ticket state'ini güncelleyelim - sayfayı yeniden yüklemeden
      setTicket({
        ...ticket,
        operations: updatedOperations,
      });

      // Avans ödeme değerini otomaik güncelleme
      setAdvancePayment(ticket.ticket_advance_pay || 0);

      // Alanları temizle
      setSelectedOperation("");
      setOperationPrice("");

      // Başarı mesajı göster
      showSuccess("İşlem başarıyla eklendi");
      const operationName = availableOperations.find((op) => op.operation_id === parseInt(selectedOperation, 10))?.operation_name;
      createLog("OPERATION_ADDED", `"${operationName}" operasyonu ${operationPrice} ₺ fiyatla eklendi.`, {
        operationId: selectedOperation,
        operationName: operationName,
        price: operationPrice,
      });
    } catch (error) {
      showError("İşlem eklenirken bir hata oluştu");
      handleApiError(error);
    }
  };

  // Operasyon silme işlemi
  const handleDeleteOperation = async (operationId) => {
    try {
      // Eğer ticket'ta sadece 1 operasyon varsa, silme işlemini engelle
      if (ticket.operations && ticket.operations.length <= 1) {
        showError("Bilet en az bir işlem içermelidir. Son işlemi silemezsiniz.");
        return;
      }

      if (!window.confirm("Bu işlemi silmek istediğinizden emin misiniz?")) {
        return;
      }

      // Silmeden önce operasyon bilgilerini kaydet
      const operation = ticket.operations.find((op) => op.ticket_operation_id === operationId);
      const operationName = operation ? operation.operation_name : "Bilinmeyen Operasyon";
      const operationPrice = operation ? operation.ticket_operation_price : "bilinmeyen";

      const result = await ticketService.deleteTicketOperation(operationId);

      if (result.success) {
        // Yerel state'i güncelle - sayfayı yeniden yüklemeden
        const updatedOperations = ticket.operations.filter((op) => op.ticket_operation_id !== operationId);

        // Ticket state'ini güncelleyelim
        setTicket({
          ...ticket,
          operations: updatedOperations,
        });

        // Avans ödeme değerini güncel bilet durumuna göre ayarla
        setAdvancePayment(ticket.ticket_advance_pay || 0);

        // Başarı mesajı göster
        showSuccess("İşlem başarıyla silindi.");

        // Log kaydı oluştur
        createLog("OPERATION_DELETED", `"${operationName}" operasyonu silindi (Fiyat: ${operationPrice} ₺).`, {
          operationId,
          operationName,
          price: operationPrice,
        });
      } else {
        showError("İşlem silinirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Error deleting operation:", error);
      showError("İşlem silinirken bir hata oluştu.");
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

      // Başarılı güncelleme sonrası orijinal değeri güncelle
      setOriginalAdvancePayment(Number(advancePayment));

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

      // Başarılı sıfırlama sonrası orijinal değeri güncelle
      setOriginalAdvancePayment(0);

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

      // Başarılı güncelleme sonrası orijinal değeri güncelle
      setOriginalSpareParts(spareParts);

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

      // Başarılı güncelleme sonrası orijinal değeri güncelle
      setOriginalNotes(notes);

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
            width: 120px;
            flex-shrink: 0;
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
          .row {
            display: flex;
            margin-bottom: 20px;
          }
          .column {
            flex: 1;
          }
          .column-left {
            margin-right: 10px;
          }
          .column-right {
            margin-left: 10px;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #ddd;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .shop-info {
            flex: 1;
          }
          .ticket-info {
            flex: 1;
            text-align: right;
          }
          .ticket-id {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .shop-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .shop-details {
            font-size: 14px;
            margin-bottom: 3px;
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
        <!-- Üst satır: Mağaza bilgileri ve bilet numarası -->
        <div class="header-row">
          <div class="shop-info">
            <div class="shop-name">Teknik Servis</div>
            <div class="shop-details">Adres: Örnek Caddesi No: 123, İstanbul</div>
            <div class="shop-details">Telefon: +90 212 123 45 67</div>
            <div class="shop-details">E-posta: info@teknikservis.com</div>
            <div class="shop-details">Web: www.teknikservis.com</div>
          </div>
          <div class="ticket-info">
            <div class="ticket-id">Servis Fişi #${ticket.ticket_id}</div>
            <div class="shop-details">Oluşturma: ${formatDate(ticket.created_at)}</div>
            <div class="shop-details">Durum: ${formatStatusText(ticket.ticket_status)}</div>
          </div>
        </div>
        
        <!-- Orta satır: Müşteri ve cihaz bilgileri -->
        <div class="row">
          <!-- Müşteri bilgileri -->
          <div class="column column-left">
            <div class="section-title">Müşteri Bilgileri</div>
            
            ${
              ticket.customer_name
                ? `
            <div class="info-row">
              <div class="info-label">Müşteri Adı:</div>
              <div class="info-value">${ticket.customer_name}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.customer_type
                ? `
            <div class="info-row">
              <div class="info-label">Müşteri Tipi:</div>
              <div class="info-value">${ticket.customer_type === "individual" ? "Bireysel" : "Kurumsal"}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.customer_company
                ? `
            <div class="info-row">
              <div class="info-label">Şirket:</div>
              <div class="info-value">${ticket.customer_company}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.customer_phone
                ? `
            <div class="info-row">
              <div class="info-label">Telefon:</div>
              <div class="info-value">${ticket.customer_phone}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.customer_email
                ? `
            <div class="info-row">
              <div class="info-label">E-posta:</div>
              <div class="info-value">${ticket.customer_email}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.customer_address
                ? `
            <div class="info-row">
              <div class="info-label">Adres:</div>
              <div class="info-value">${ticket.customer_address}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.customer_notification
                ? `
            <div class="info-row">
              <div class="info-label">İletişim Tercihi:</div>
              <div class="info-value">${formatNotification(ticket.customer_notification)}</div>
            </div>`
                : ""
            }
          </div>
          
          <!-- Cihaz bilgileri -->
          <div class="column column-right">
            <div class="section-title">Cihaz Bilgileri</div>
            
            ${
              ticket.device_brand_name
                ? `
            <div class="info-row">
              <div class="info-label">Marka:</div>
              <div class="info-value">${ticket.device_brand_name}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.device_type_name
                ? `
            <div class="info-row">
              <div class="info-label">Cihaz Tipi:</div>
              <div class="info-value">${ticket.device_type_name}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.device_model_name
                ? `
            <div class="info-row">
              <div class="info-label">Model:</div>
              <div class="info-value">${ticket.device_model_name}</div>
            </div>`
                : ""
            }
            
            ${
              ticket.ticket_device_serial
                ? `
            <div class="info-row">
              <div class="info-label">Seri/IMEI:</div>
              <div class="info-value">${ticket.ticket_device_serial}</div>
            </div>`
                : ""
            }
            
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
        </div>

        <!-- Alt satır: Servis işlemleri -->
        <div class="section">
          <div class="section-title">Servis İşlemleri</div>
          <table>
            <thead>
              <tr>
                <th>İşlem</th>
                <th style="width: 150px;">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              ${
                ticket.operations && ticket.operations.length > 0
                  ? ticket.operations
                      .map(
                        (op) => `
                <tr>
                  <td>${op.operation_name || `İşlem #${op.operation_id}`}</td>
                  <td style="text-align: right;">₺${parseFloat(op.ticket_operation_price).toFixed(2)}</td>
                </tr>
              `
                      )
                      .join("")
                  : `<tr><td colspan="2" style="text-align: center;">İşlem bulunamadı</td></tr>`
              }
              <tr class="total-row">
                <td style="text-align: right;">Toplam:</td>
                <td style="text-align: right;">₺${calculateTotal().toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: right;">Avans Ödeme:</td>
                <td style="text-align: right;">₺${parseFloat(ticket.ticket_advance_pay || 0).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td style="text-align: right;">Kalan Bakiye:</td>
                <td style="text-align: right;">₺${calculateRemainingBalance().toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>       

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; margin-right: 10px; cursor: pointer;">Yazdır</button>
          <button onclick="window.close()" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Kapat</button>
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

  // Bildirim türünü Türkçe olarak formatla
  const formatNotification = (notification) => {
    const types = {
      call: "Telefon",
      sms: "SMS",
      email: "E-posta",
      whatsapp: "WhatsApp",
      "": "Belirtilmemiş",
    };

    return types[notification] || notification;
  };

  // Bildirim türüne göre ikon seç
  const getNotificationIcon = (notification) => {
    const icons = {
      call: "ri-phone-line",
      sms: "ri-message-2-line",
      email: "ri-mail-line",
      whatsapp: "ri-whatsapp-line",
      "": "ri-notification-line",
    };

    return icons[notification] || "ri-notification-line";
  };

  // Fiyat input alanı için bir ref oluşturalım
  const priceInputRef = useRef(null);

  // selectedOperation değiştiğinde fiyat inputuna odaklanma
  useEffect(() => {
    if (selectedOperation && priceInputRef.current) {
      priceInputRef.current.focus();
    }
  }, [selectedOperation]);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header and Buttons */}
      <div className="card bg-transparent shadow-none border-0 my-4">
        <div className="card-body p-0">
          <div className="row">
            <div className="col-md-6">
              <h4 className="fw-bold py-3 mb-4">Servis Fişi - #{id}</h4>
            </div>
            <div className="col-md-6 d-flex justify-content-end align-items-center">
              <button type="button" className="btn btn-primary me-2" onClick={handlePrint}>
                <i className="bx bx-printer me-1"></i> Yazdır
              </button>
              <Link to="/tickets" className="btn btn-outline-secondary me-2">
                <i className="bx bx-arrow-back me-1"></i> Geri
              </Link>
            </div>
          </div>
          <div></div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="mt-3">Servis fişi detayları yükleniyor...</p>
        </div>
      ) : ticket ? (
        <>
          {/* Status Bar and Actions */}
          <div className="row my-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    <span>Durum Bilgileri</span>
                  </h5>

                  <div className="row g-3 mt-2">
                    <div className="col-md-3">
                      <div className="status-card p-3 border rounded">
                        <div className="small text-muted mb-1">Mevcut Durum</div>
                        <div className="dropdown">
                          <button
                            className={`btn btn-outline-${getStatusObject(ticket.ticket_status).color} text-${getStatusObject(ticket.ticket_status).color} dropdown-toggle ${ticket.ticket_delivered ? "disabled" : ""}`}
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            disabled={ticket.ticket_delivered}
                          >
                            <div className="d-flex align-items-center">
                              <span className={`status-dot bg-${getStatusObject(ticket.ticket_status).color}  me-2`} style={{ width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" }}></span>
                              {getStatusObject(ticket.ticket_status).label}
                            </div>
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
                                      // Dropdown'ı manuel olarak kapat
                                      document.querySelector(".dropdown-toggle").click();
                                    }
                                  }}
                                >
                                  <div className="d-flex align-items-center">
                                    <span className={`status-dot bg-${option.color} me-2`} style={{ width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" }}></span>
                                    {option.label}
                                  </div>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="status-card p-3 border rounded">
                        <div className="small text-muted mb-1">Teslim Durumu</div>
                        <button className="btn btn-primary d-flex align-items-center" onClick={handleMarkAsDelivered} disabled={ticket.ticket_delivered || (ticket.ticket_status !== "repaired" && ticket.ticket_status !== "not_repaired")}>
                          <i className="fas fa-handshake me-2"></i> {ticket.ticket_delivered ? "Teslim Edildi" : "Teslim Et"}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="status-card p-3 border rounded">
                        <div className="small text-muted mb-1">Kayıt Tarihi</div>
                        <div className="d-flex align-items-center mb-4">
                          <i className="ri-calendar-check-line me-2 text-primary"></i>
                          <h6 className="mb-0">{formatDate(ticket.created_at)}</h6>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="status-card p-3 border rounded">
                        <div className="small text-muted mb-1">Son Güncelleme</div>
                        <div className="d-flex align-items-center mb-4">
                          <i className="ri-time-line me-2 text-primary"></i>
                          <h6 className="mb-0">{formatDate(ticket.updated_at)}</h6>
                        </div>
                      </div>
                    </div>
                  </div>

                  {ticket.ticket_logs && ticket.ticket_logs.length > 0 && (
                    <div className="mt-3">
                      <button className="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#ticketHistory" aria-expanded="false" aria-controls="ticketHistory">
                        <i className="ri-history-line me-1"></i> Durum Geçmişi ({ticket.ticket_logs.length})
                      </button>
                      <div className="collapse mt-2" id="ticketHistory">
                        <div className="timeline-compact border-start border-2 ps-3">
                          {ticket.ticket_logs.map((log, index) => (
                            <div key={index} className="timeline-item pb-2">
                              <div className="small text-muted">{formatDate(log.created_at)}</div>
                              <div>{log.log_description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer and Device Information */}
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center border-0">
                  <h5 className="mb-0">
                    <i className="ri-user-line me-2"></i>Müşteri Bilgileri
                  </h5>
                </div>
                <div className="card-body">
                  {customer ? (
                    <div className="row g-3">
                      {ticket.customer_name && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className="ri-user-heart-line fs-4 text-primary"></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="small text-muted">Müşteri Adı</div>
                              <Link to={`/customers/${customer.customer_id}`}>
                                <div className="fw-semibold">{ticket.customer_name}</div>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.customer_type && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className={`ri-${ticket.customer_type === "individual" ? "user-line" : "building-line"} fs-4 text-primary`}></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="small text-muted">Müşteri Tipi</div>
                              <div className="fw-semibold">{ticket.customer_type === "individual" ? "Bireysel" : "Kurumsal"}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.customer_company && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className="ri-building-4-line fs-4 text-primary"></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="small text-muted">Firma</div>
                              <div className="fw-semibold">{ticket.customer_company}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.customer_phone && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className="ri-phone-line fs-4 text-primary"></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="small text-muted">Telefon</div>
                              <div className="fw-semibold">{ticket.customer_phone}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.customer_email && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className="ri-mail-line fs-4 text-primary"></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="small text-muted">E-posta</div>
                              <div className="fw-semibold">{ticket.customer_email}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.customer_address && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className="ri-map-pin-line fs-4 text-primary"></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="small text-muted">Adres</div>
                              <div className="fw-semibold">{ticket.customer_address}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.customer_notification && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className={`${getNotificationIcon(ticket.customer_notification)} fs-4 text-primary`}></i>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <div className="small text-muted">Tercih Edilen İletişim</div>
                              <div className="fw-semibold">{formatNotification(ticket.customer_notification)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="ri-user-search-line fs-1 mb-2"></i>
                      <p>Müşteri bilgileri mevcut değil</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header  border-0">
                  <h5 className="mb-0">
                    <i className="ri-device-line me-2"></i>Cihaz Bilgileri
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {ticket.device_type_name && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="ri-smartphone-line fs-4 text-primary"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="small text-muted">Cihaz Tipi</div>
                            <div className="fw-semibold">{ticket.device_type_name}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {ticket.device_brand_name && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="ri-chrome-line fs-4 text-primary"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="small text-muted">Marka</div>
                            <div className="fw-semibold">{ticket.device_brand_name}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {ticket.device_model_name && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="ri-cellphone-line fs-4 text-primary"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="small text-muted">Model</div>
                            <div className="fw-semibold">{ticket.device_model_name}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {ticket.ticket_device_serial && (
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="ri-barcode-line fs-4 text-primary"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="small text-muted">Seri/IMEI</div>
                            <div className="fw-semibold">{ticket.ticket_device_serial}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {ticket.ticket_accessories && (
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="ri-plug-line fs-4 text-primary"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="small text-muted">Aksesuarlar</div>
                            <div className="fw-semibold">{ticket.ticket_accessories}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {ticket.ticket_spare_parts && (
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="ri-tools-line fs-4 text-primary"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="small text-muted">Yedek Parçalar</div>
                            <div className="fw-semibold">{ticket.ticket_spare_parts}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              {/* Operations and Financial Information */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Servis İşlemleri</h5>
                </div>
                <div className="card-body">
                  {/* Yeni Operasyon Ekleme Formu */}
                  <div className="mb-4">
                    <label className="form-label">Yeni İşlem Ekle</label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <select className="form-select" value={selectedOperation} onChange={(e) => setSelectedOperation(e.target.value)} disabled={ticket.ticket_delivered}>
                          <option value="">Bir işlem seçin</option>
                          {getFilteredOperations().map((op) => (
                            <option key={op.operation_id} value={op.operation_id}>
                              {op.operation_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text">₺</span>
                          <input type="number" className="form-control" placeholder="Fiyat" min="0" step="0.01" value={operationPrice} onChange={(e) => setOperationPrice(e.target.value)} disabled={ticket.ticket_delivered} ref={priceInputRef} />
                          <button type="button" className="btn btn-primary waves-effect" onClick={handleAddOperation} disabled={!selectedOperation || !operationPrice || ticket.ticket_delivered}>
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
                          <th>İşlem</th>
                          <th>Fiyat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticket.operations && ticket.operations.length > 0 ? (
                          <>
                            {ticket.operations.map((op, index) => (
                              <tr key={index}>
                                <td>{op.operation_name || `İşlem #${op.operation_id}`}</td>
                                <td>
                                  <div className="input-group" style={{ minWidth: "240px" }}>
                                    <span className="input-group-text">₺</span>
                                    <input
                                      className="form-control"
                                      min="0"
                                      step="0.01"
                                      type="number"
                                      value={editedPrices[op.ticket_operation_id] !== undefined ? editedPrices[op.ticket_operation_id] : op.ticket_operation_price}
                                      onChange={(e) => handlePriceInputChange(op.ticket_operation_id, e.target.value)}
                                      disabled={ticket.ticket_delivered}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-success waves-effect"
                                      onClick={() => handlePriceChange(op.ticket_operation_id)}
                                      title="Kaydet"
                                      disabled={ticket.ticket_delivered || editedPrices[op.ticket_operation_id] === undefined || parseFloat(editedPrices[op.ticket_operation_id]) === parseFloat(originalPrices[op.ticket_operation_id])}
                                    >
                                      <i className="ri-check-line"></i>
                                    </button>
                                    <button type="button" className="btn btn-danger waves-effect" onClick={() => handleDeleteOperation(op.ticket_operation_id)} title="Sil" disabled={ticket.ticket_delivered}>
                                      <i className="ri-delete-bin-line"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            <tr className="table-active">
                              <td className="text-end fw-bold">Toplam:</td>
                              <td className="fw-bold">₺{calculateTotal().toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="text-end fw-bold text-danger">Avans Ödeme:</td>
                              <td>
                                <div className="input-group">
                                  <span className="input-group-text">₺</span>
                                  <input className="form-control" min="0" step="0.01" type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} disabled={ticket.ticket_delivered} />
                                  <button type="button" className="btn btn-success waves-effect" onClick={handleUpdateAdvancePayment} title="Kaydet" disabled={ticket.ticket_delivered || parseFloat(advancePayment) === originalAdvancePayment}>
                                    <i className="ri-check-line"></i>
                                  </button>
                                  <button type="button" className="btn btn-warning waves-effect" onClick={handleResetAdvancePayment} title="Sıfırla" disabled={ticket.ticket_delivered || (parseFloat(advancePayment) === 0 && originalAdvancePayment === 0)}>
                                    <i className="ri-restart-line"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="text-end fw-bold">Kalan Bakiye:</td>
                              <td className="fw-bold">₺{calculateRemainingBalance().toFixed(2)}</td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td colSpan="2" className="text-center">
                              İşlem eklenmemiş
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
                  <h5 className="mb-0">Yedek Parçalar</h5>
                </div>
                <div className="card-body">
                  <div className="input-group">
                    <input type="text" className="form-control" placeholder="Yedek Parça Bilgileri" value={spareParts} onChange={(e) => setSpareParts(e.target.value)} disabled={ticket.ticket_delivered} />
                    <button className="btn btn-success waves-effect" type="button" onClick={handleUpdateSpareParts} title="Kaydet" style={{ alignSelf: "stretch" }} disabled={ticket.ticket_delivered || spareParts === originalSpareParts}>
                      <i className="ri-check-line"></i>
                    </button>
                  </div>
                </div>
              </div>
              {/* Notes */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Notlar</h5>
                </div>
                <div className="card-body">
                  <div className="input-group mb-3">
                    <textarea className="form-control" rows="5" placeholder="Bu bilet hakkında notlar" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ whiteSpace: "pre-line" }} disabled={ticket.ticket_delivered}></textarea>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-primary waves-effect" type="button" onClick={handleUpdateNotes} title="Notları Güncelle" style={{ alignSelf: "stretch" }} disabled={ticket.ticket_delivered || notes === originalNotes}>
                      Güncelle
                    </button>
                  </div>
                </div>
              </div>
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
          <h5>Servis Fişi Bulunamadı</h5>
          <p className="text-muted">Aradığınız servis fişi bulunamadı veya silindi.</p>
          <Link to="/tickets" className="btn btn-primary mt-3">
            Servis Fişlerine Geri Dön
          </Link>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
