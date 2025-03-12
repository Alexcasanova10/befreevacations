const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Agente = require("../models/Usuarios/agentes_cc.js");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1️⃣ Buscar token en los Headers (Bearer Token)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2️⃣ Buscar en la Cookie
  else if (req.cookies.refreshToken) {
    token = req.cookies.refreshToken;
  } 
  // 3️⃣ Buscar en la sesión (si aplica)
  else if (req.session && req.session.token) {
    token = req.session.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No estás autorizado, falta token" });
  }

  try {
    // Verificar el token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener el usuario sin la contraseña
    req.agente = await Agente.findById(decodedToken.id).select("-password");
    
    if (!req.agente) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    next();
  } catch (err) {
    console.error("Error de autenticación:", err);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
});

module.exports = protect;
