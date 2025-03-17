const errorHandler = (err, req, res, next) => {
  console.error("Hata yakalandı:", err);

  // MySQL hata kodlarını kontrol et
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "Bu kayıt zaten mevcut.",
      details: err.sqlMessage,
    });
  }

  // Diğer MySQL hataları
  if (err.sqlMessage) {
    return res.status(400).json({
      success: false,
      message: "Veritabanı işlemi başarısız.",
      details: err.sqlMessage,
    });
  }

  // JWT veya yetkilendirme hataları
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Oturum geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.",
    });
  }

  // Validasyon hataları
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Girilen veriler geçersiz.",
      details: err.details || err.message,
    });
  }

  // Genel hata mesajı (üretimde hassas hata detaylarını gizle)
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === "production" ? "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin." : err.message || "Sunucu hatası";

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
  });
};

export default errorHandler;
