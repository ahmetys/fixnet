import bcrypt from "bcryptjs";
import * as User from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // Token oluştur
    const token = jwt.sign({ userId: user.user_id, email: user.user_email }, process.env.JWT_SECRET, { expiresIn: "30d" });

    // Session'ı kaydet
    await User.createSession(user.user_id, token);

    // Kullanıcı bilgilerini ve token'ı döndür
    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.user_email,
        name: user.user_name,
        role: user.user_role,
      },
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  await User.deleteSession(req.user.userId);
  res.json({ message: "Logout successful" });
};

export const getCurrentUser = async (req, res) => {
  const user = await User.getCurrentUser(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(user);
};

// Şifre sıfırlama talebi
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // E-posta kontrolü
    if (!email) {
      return res.status(400).json({ success: false, message: "E-posta adresi gereklidir" });
    }

    // Kullanıcı kontrolü
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({ success: false, message: "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı" });
    }

    // Sıfırlama tokeni oluştur
    const resetToken = await User.createPasswordResetToken(user.user_id, email);

    // E-posta gönderme
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Mail içeriği
    const mailOptions = {
      from: `"FIXNET" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Şifre Sıfırlama",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Şifre Sıfırlama</h2>
          <p>Merhaba ${user.user_name},</p>
          <p>FIXNET hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <p style="margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #696cff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Şifremi Sıfırla</a>
          </p>
          <p>Bu bağlantı 1 saat sonra geçerliliğini yitirecektir.</p>
          <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <p>Saygılarımızla,<br>FIXNET Ekibi</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Token doğrulama
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: "Geçersiz token" });
    }

    // Token'ı veritabanında kontrol et
    const resetToken = await User.verifyResetToken(token);

    if (!resetToken) {
      return res.status(400).json({ success: false, message: "Geçersiz veya süresi dolmuş token" });
    }

    res.json({ success: true, message: "Token geçerli" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Şifre sıfırlama
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token ve yeni şifre gereklidir" });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Şifre en az 6 karakter olmalıdır" });
    }

    // Token'ı veritabanında kontrol et
    const resetToken = await User.verifyResetToken(token);

    if (!resetToken) {
      return res.status(400).json({ success: false, message: "Geçersiz veya süresi dolmuş token" });
    }

    // Şifreyi güncelle
    await User.resetUserPassword(resetToken.user_id, newPassword);

    // Token'ı sil
    await User.deleteResetToken(token);

    res.json({ success: true, message: "Şifre başarıyla güncellendi" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};
