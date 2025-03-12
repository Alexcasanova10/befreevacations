const express = require("express");
const agenciasRoute = express.Router();
const AsyncHandler = require("express-async-handler");
const Agencias = require("../../models/Productos/agencias.js");
const AgenteCC = require("../../models/Usuarios/agentes_cc.js");

const { validarEmail, validarDominioEmail, validarTelefono } = require("../../utils/validaciones.js");

agenciasRoute.get("/obtener", AsyncHandler(async (req,res)=>{
 try {
        const agencia = await Agencias.find();
        res.json(agencia);
    } catch (error) {
        res.status(500).json({ message: "No se pudo obtener los destinos", error: error.message });
    }    
}))

//Crear agencia 

agenciasRoute.post("/registrar-agencias", AsyncHandler(async (req, res) => {
    const { nombre_agencia, razon_social, rfc, email, telefono, domicilio } = req.body;

    // Validar que no haya datos vacíos
    if (!nombre_agencia || !razon_social || !rfc || !email || !telefono || !domicilio) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Validar formato del email
    if (!validarEmail(email)) {
        return res.status(400).json({ message: "Formato de email inválido" });
    }

    // Validar dominio del email
    const dominioValido = await validarDominioEmail(email);
    if (!dominioValido) {
        return res.status(400).json({ message: "El dominio del email no es válido" });
    }

    // Validar teléfono
    if (!validarTelefono(telefono)) {
        return res.status(400).json({ message: "El teléfono debe tener exactamente 10 dígitos numéricos" });
    }

    // Validar si la agencia ya existe
    const agenciaExistente = await Agencias.findOne({ rfc });
    if (agenciaExistente) {
        return res.status(400).json({ message: "La agencia con este RFC ya está registrada" });
    }

    // Crear la agencia
    const nuevaAgencia = new Agencias({
        nombre_agencia,
        razon_social,
        rfc,
        email,
        telefono,
        domicilio
    });

    await nuevaAgencia.save();
    
    res.status(201).json({ message: "Agencia registrada correctamente", agencia: nuevaAgencia });
}));



//PATCH actualizar cualquier parte de la información de agencia 
agenciasRoute.patch("/actualizar-agencia/:id", AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre_agencia, razon_social, rfc, email, telefono, domicilio } = req.body;

    // Verificar si la agencia existe
    const agencia = await Agencias.findById(id);
    if (!agencia) {
        return res.status(404).json({ message: "Agencia no encontrada" });
    }

    // Validar email si se envía
    if (email && !validarEmail(email)) {
        return res.status(400).json({ message: "Formato de email inválido" });
    }

    // Validar dominio del email si se envía
    if (email) {
        const dominioValido = await validarDominioEmail(email);
        if (!dominioValido) {
            return res.status(400).json({ message: "El dominio del email no es válido" });
        }
    }

    // Validar teléfono si se envía
    if (telefono && !validarTelefono(telefono)) {
        return res.status(400).json({ message: "El teléfono debe tener exactamente 10 dígitos numéricos" });
    }

    // Actualizar solo los campos enviados
    const datosActualizados = {};
    if (nombre_agencia) datosActualizados.nombre_agencia = nombre_agencia;
    if (razon_social) datosActualizados.razon_social = razon_social;
    if (rfc) datosActualizados.rfc = rfc;
    if (email) datosActualizados.email = email;
    if (telefono) datosActualizados.telefono = telefono;
    if (domicilio) datosActualizados.domicilio = domicilio;

    // Actualizar la agencia en MongoDB
    const agenciaActualizada = await Agencias.findByIdAndUpdate(id, datosActualizados, { new: true });

    res.status(200).json({ message: "Agencia actualizada correctamente", agencia: agenciaActualizada });
}));

//	GET Obtener listado de Agentes _cc que pertenezcan a esa agencia. 
agenciasRoute.get("agentes", AsyncHandler(async (req,res)=>{
    
}));

//	Información de Agentes _cc que pertenezcan a esa agencia. 
agenciasRoute.get("agentes/:id", AsyncHandler(async (req,res)=>{
    
}));

//	GET Obtener Productos (Tours o paquetes hoteleros) con vinculación a la agencia. 
agenciasRoute.get("agentes", AsyncHandler(async (req,res)=>{
    
}));




module.exports = agenciasRoute;