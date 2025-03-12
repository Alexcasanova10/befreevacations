const express = require("express");
const userRoute = express.Router();
const AsyncHandler = require("express-async-handler");
const Usuarios = require("../../models/Usuarios/usuarios.js");
const Cliente = require("../../models/Usuarios/clientes.js");
const AgenteCC  = require("../../models/Usuarios/agentes_cc.js");
const Admins  = require("../../models/Usuarios/admins.js");

// Ruta GET para obtener todos los usuarios con su información completa
userRoute.get("/info-users", AsyncHandler(async (req, res) => {
    const usuarios = await Usuarios.find().populate("info_user");  // Hacemos populate para obtener los datos completos
    res.json(usuarios);
}));

// Ruta GET para obtener un usuario específico con su información completa
userRoute.get("/info-users/:id", AsyncHandler(async (req, res) => {
    const usuario = await Usuarios.findById(req.params.id).populate("info_user");

    if (usuario) {
        res.json(usuario);
    } else {
        res.status(404);
        throw new Error("Usuario no encontrado");
    }
}));

module.exports = userRoute;
