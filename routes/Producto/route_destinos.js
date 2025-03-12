const express = require("express");
const destinosRoute = express.Router();
const AsyncHandler = require("express-async-handler");
const Destinos = require("../../models/Productos/destinos.js");

// Crear Destino
destinosRoute.post("/crear", AsyncHandler(async (req, res) => {
    const { tipo_destino } = req.body;
    
    if (tipo_destino !== 'Cancún' && tipo_destino !== "Los Cabos" && tipo_destino !== "Riviera Maya" && tipo_destino !== "Tulum" && tipo_destino !== "Isla Mujeres" && tipo_destino !== "Cozumel") {
        return res.status(404).json({ message: "Destino inválido" });
    }

    const destinos = new Destinos({ tipo_destino });
    
    const destino_creado = await destinos.save();

    res.status(200).json(destino_creado);
}));

// Obtener Destinos
destinosRoute.get("/destinos", AsyncHandler(async (req, res) => {
    try {
        const destinos = await Destinos.find();
        res.json(destinos);
    } catch (error) {
        res.status(500).json({ message: "No se pudo obtener los destinos", error: error.message });
    }
}));

// Obtener tours o paquetes hoteleros (productos) por destino
destinosRoute.get("/destinos/:id", AsyncHandler(async (req, res) => {
    res.json({ message: "Ruta de prueba" });
}));

module.exports = destinosRoute;
