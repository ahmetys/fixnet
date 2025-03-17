// middleware/auth.js
import jwt from "jsonwebtoken";
import * as User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization failed" });
    }

    const token = authHeader.split(" ")[1];

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Session kontrolü
    const session = await User.checkSession(decoded.userId, token);
    if (!session) {
      return res.status(401).json({ message: "Session invalid or expired" });
    }

    // Kullanıcı bilgisini request'e ekle
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Yetkilendirme başarısız" });
  }
};

export { auth };
