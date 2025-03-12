 

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AsyncHandler = require("express-async-handler");
const AgenteCC = require("../../models/Usuarios/agentes_cc.js");
const Agencia = require("../../models/Productos/agencias.js");
const protect = require("../../middleware/authAgente.js");
const dns = require("dns");
const Usuarios = require("../../models/Usuarios/usuarios.js");

const agenteRoute = express.Router();

const { sanitizeInput, hasMaliciousContent, limiter } = require("../../utils/security.js");
const {validarDominioEmail, validarEmailValidator} =  require("../../utils/validaciones.js");

const validarEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};


//Registrar agente

// agenteRoute.post("/registrar-agente",AsyncHandler(async (req, res) => {
//       const { nombre, apellido, email, password, telefono,fecha_nacimiento, observaciones, id_agente, Agencia} = req.body;
    
//       // Validar el formato del email
//     if (!validarEmail(email)) {
//         return res.status(400).json({ message: "Correo electrónico no válido" });
//     }
      
//     // Extraer el dominio del correo
//     const dominio = email.split("@")[1];


//     dns.resolveMx(dominio, async (err, direcciones) => {
//         if (err || !direcciones || direcciones.length === 0) {
//             console.log(err);
//             return res.status(400).json({ message: "El dominio del correo no es válido" });
//         }

//         const agenteExistente = await AgenteCC.findOne({ email });
        
//         if (agenteExistente) {
//           return res.status(400).json({ message: "El correo ya está registrado" });
//         }
    
//         const nuevoAgente = new AgenteCC({ nombre, apellido, email, password, telefono,fecha_nacimiento, observaciones, id_agente, Agencia});
//         await nuevoAgente.save();
    
//         // Crear en la colección Usuarios
//         const nuevoUsuario = new Usuarios({
//           tipo_usuario: "AgenteCC",
//           info_user: nuevoAgente._id,
//         });
    
//         await nuevoUsuario.save();
//         res.status(201).json(nuevoAgente);
//     });
//   }));


// ID de agentes: BFV0001 es el nombre agencia (primeras tres letras en capital del noimbnre de agencia de las primetres palabras, o sea si es Be Free Vacations, que se a BFV numero de serie, conforme 001, PERO si la agencia NO tiene tres palabras, recorta tres primeras letras de la primera palabra, ejemplo: nombre agencia AMSTAR = id agente = AMS001

agenteRoute.post("/registrar-agente", AsyncHandler(async (req, res) => {
    const { nombre, apellido, email, password, telefono, fecha_nacimiento, observaciones, agencia_nombre } = req.body;

    if (!validarEmail(email)) {
        return res.status(400).json({ message: "Correo electrónico no válido" });
    }

    const dominio = email.split("@")[1];

    dns.resolveMx(dominio, async (err, direcciones) => {
        if (err || !direcciones || direcciones.length === 0) {
            console.log(err);
            return res.status(400).json({ message: "El dominio del correo no es válido" });
        }

        const agenteExistente = await AgenteCC.findOne({ email });
        if (agenteExistente) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }

        const agencia = await Agencia.findOne({ nombre_agencia: agencia_nombre });

        if (!agencia) {
            return res.status(400).json({ message: "La agencia no existe" });
        }

        let idAgenteBase;
        const palabras = agencia_nombre.trim().split(" ");

        if (palabras.length >= 3) {
            idAgenteBase = palabras[0].substring(0, 1).toUpperCase() +
                palabras[1].substring(0, 1).toUpperCase() +
                palabras[2].substring(0, 1).toUpperCase();
        } else {
            idAgenteBase = palabras[0].substring(0, 3).toUpperCase();
        }

        const count = await AgenteCC.countDocuments({ id_agente: new RegExp(`^${idAgenteBase}\\d{3}$`) });
        const id_agente = `${idAgenteBase}${String(count + 1).padStart(3, "0")}`;

        const nuevoAgente = new AgenteCC({
            nombre,
            apellido,
            email,
            password,
            telefono,
            fecha_nacimiento,
            observaciones,
            id_agente,
            agencia: agencia._id,
        });

        await nuevoAgente.save();

        const nuevoUsuario = new Usuarios({
            tipo_usuario: "AgenteCC",
            info_user: nuevoAgente._id,
        });

        await nuevoUsuario.save();

        // 🔥 **Usamos populate para devolver ID y nombre de la agencia**
        const agenteRegistrado = await AgenteCC.findById(nuevoAgente._id)
            .populate("agencia", "nombre_agencia"); // Solo trae ID y nombre

        res.status(201).json(agenteRegistrado);
    });
}));






// **LOGIN**
agenteRoute.post("/login",limiter, AsyncHandler(async (req, res) => {
    let { email, password } = req.body;
    const agente = await AgenteCC.findOne({ email });

    email = sanitizeInput(email);
    password = sanitizeInput(password);
    
    // Prevenir inyecciones peligrosas
    if (hasMaliciousContent(email) || hasMaliciousContent(password)) {
        return res.status(400).json({ message: "Entrada inválida." });
    }
    // Verificar si la cuenta está activa
    if (agente.estado !== "Activo") {
        return res.status(403).json({ message: "Cuenta inactiva" });
    }


    
    if (!agente) {
        return res.status(401).json({ message: "Correo o contraseña inválida" });
    }

    // Comparar contraseñas
     if (agente && (await agente.matchPassword(password))) {
         // Guardar en sesión
         req.session.agente = {
             _id: agente.id,
             nombre: agente.nombre,
             email: agente.email,
         };
    }else{
        return res.status(401).json({ message: "Correo o contraseña inválida" });
    }

    // 🔑 Generar el Access Token (expira en 1 hora)
    const token = jwt.sign({ id: agente._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 🔄 Generar el Refresh Token (expira en 30 días)
    const refreshToken = jwt.sign({ id: agente._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

    req.session.token = token;

    // Guardar el Refresh Token en Cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    res.status(200).json({
        message: "Inicio de sesión exitoso",
        token,
        agente: {
            _id: agente._id,
            nombre: agente.nombre,
            apellido: agente.apellido,
            email: agente.email
        }
    });
}));

// **PERFIL DE AGENTE** (Protegido)
agenteRoute.get("/perfil", protect, AsyncHandler(async (req, res) => {
    const agente = await AgenteCC.findById(req.agente._id)
    .populate("agencia","nombre_agencia");//copn este puedo obntener la agencia

    if (!agente) {
        return res.status(404).json({ message: "Agente no encontrado" });
    }

    res.json({
        _id: agente._id,
        email: agente.email,
        isAdmin: agente.isAdmin,
        nombre: agente.nombre,
        apellido: agente.apellido,
        telefono: agente.telefono,
        fecha_nacimiento: agente.fecha_nacimiento,
        agencia: agente.agencia,
        id_agente: agente.id_agente
    });
}));

// *LOGOUT**
agenteRoute.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "No se pudo cerrar la sesión" });
        }
        res.clearCookie("refreshToken"); // Eliminar la cookie
        res.clearCookie("token"); 
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout exitoso" });
    });
});


module.exports = agenteRoute;
