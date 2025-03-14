import bcrypt from "bcryptjs";
import * as User from "../models/User.js";
import jwt from "jsonwebtoken";
// import * as Session from "../models/Session.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    console.log(user);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // Token oluştur
    const token = jwt.sign({ userId: user.user_id, email: user.user_email }, process.env.JWT_SECRET, { expiresIn: "1h" });

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
    console.error("Login error:", error); // Debug için
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
