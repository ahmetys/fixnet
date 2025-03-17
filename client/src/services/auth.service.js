import api from "./api";

export const getCurrentUser = async () => {
  try {
    const { data } = await api.get("/auth/me");
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Kullanıcı bilgileri alınamadı. Lütfen tekrar deneyiniz.");
  }
};

export const login = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw new Error("Giriş yapılamadı. Lütfen tekrar deneyiniz.");
  }
};

export const logout = async () => {
  try {
    const { data } = await api.post("/auth/logout");
    return data;
  } catch (error) {
    console.error("Error logging out:", error);
    throw new Error("Çıkış yapılamadı. Lütfen tekrar deneyiniz.");
  }
};

export const forgotPassword = async (email) => {
  try {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  } catch (error) {
    console.error("Error forgot password:", error);
    throw new Error("Şifre sıfırlama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.");
  }
};

export const verifyResetToken = async (token) => {
  try {
    const { data } = await api.get(`/auth/reset-token/${token}`);
    return data;
  } catch (error) {
    console.error("Error verify reset token:", error);
    throw new Error("Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş");
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const { data } = await api.post("/auth/reset-password", { token, newPassword });
    return data;
  } catch (error) {
    console.error("Error reset password:", error);
    throw new Error("Şifre sıfırlama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.");
  }
};
