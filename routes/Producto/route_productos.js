const express = require("express");
const productosRoute = express.Router();
const Productos = require("../../models/Productos/productos.js");
const AsyncHandler = require("express-async-handler");
const Agencia = require("../../models/Productos/agencias.js");
const Tours = require("../../models/Productos/tour.js");
const Destino = require("../../models/Productos/destinos.js");
const Paquetes = require("../../models/Productos/paquetes_hoteleros.js");
const { validarEmail, validarDominioEmail, validarTelefono } = require("../../utils/validaciones.js");
const mongoose = require("mongoose");

productosRoute.get("obtener", AsyncHandler(async (req,res)=>{
    
}));





module.exports = productosRoute