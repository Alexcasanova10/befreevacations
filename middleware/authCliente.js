// const jwt = require("jsonwebtoken");
// const asyncHandler = require("express-async-handler");
// const Cliente = require("../models/Usuarios/clientes.js")
 
// const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   // Prioridad 1: Token de los headers de autorización
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   } 
//   // Prioridad 2: Token de la sesión de Google
//   else if (req.session.token) {
//     token = req.session.token;
//   }

//   if (token) {
//     try {
//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//       req.cliente = await Cliente.findById(decodedToken.id).select("-password");
//       return next();
//     } catch (err) {
//       console.error("Error de token:", err);
//       res.status(401).json({ message: "No estás autorizado" });
//     }
//   } else {
//     res.status(401).json({ message: "No estás autorizado, falta token" });
//   }
// });

// module.exports = protect;


const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Cliente = require("../models/Usuarios/clientes.js");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.refreshToken) {
    token = req.cookies.refreshToken;
  }

  if (!token) {
    return res.status(401).json({ message: "No estás autorizado, falta token" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.cliente = await Cliente.findById(decodedToken.id).select("-password");
    return next();
  } catch (err) {
    console.error("Error de token:", err);
    res.status(401).json({ message: "No estás autorizado" });
  }
});

module.exports = protect;












// const jwt = require("jsonwebtoken");
// const asyncHandler = require("express-async-handler");
// const Cliente = require("../models/Usuarios/clientes.js");

// const protect = asyncHandler(async (req, res, next) => {
//     let token;

//     if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//         token = req.headers.authorization.split(" ")[1];
//     } else if (req.session.token) {
//         token = req.session.token;
//     }

//     if (!token) {
//         return res.status(401).json({ message: "No estás autorizado, falta token" });
//     }

//     try {
//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//         req.cliente = await Cliente.findById(decodedToken.id).select("-password");
//         next();
//     } catch (err) {
//         if (err.name === "TokenExpiredError") {
//             return res.status(401).json({ message: "Token expirado, inicia sesión de nuevo" });
//         }
//         res.status(401).json({ message: "Token inválido" });
//     }
// });

// module.exports = protect;


// const jwt = require("jsonwebtoken");
// const asyncHandler = require("express-async-handler");
// const Cliente = require("../models/Usuarios/clientes.js");

// const protect = asyncHandler(async (req, res, next) => {
//     let token;

//     // 1️⃣ Prioridad: Token en los headers
//     if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//         token = req.headers.authorization.split(" ")[1];
//     } 
//     // 2️⃣ Token en la sesión
//     else if (req.session.token) {
//         token = req.session.token;
//     }
//     // 3️⃣ Token en la cookie
//     else if (req.cookies.token) {
//         token = req.cookies.token;
//     }

//     if (!token) {
//         return res.status(401).json({ message: "No estás autorizado, falta token" });
//     }

//     try {
//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//         req.cliente = await Cliente.findById(decodedToken.id).select("-password");
//         next();
//     } catch (err) {
//         console.error("Error de token:", err);
//         res.status(401).json({ message: "Token inválido o expirado" });
//     }
// });

// module.exports = protect;
