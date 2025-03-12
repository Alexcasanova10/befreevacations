const express = require("express");
const contactoRoute = express.Router();
const AsyncHandler = require("express-async-handler");
const Email = require("../../models/Contacto/formularios_correo.js");
const dns = require("dns");
const nodemailer = require('nodemailer');
const { json } = require("stream/consumers");
require('dotenv').config();

const {sanitizeInput, hasMaliciousContent, limiter } = require("../../utils/security.js");
const {validarTelefono} =  require("../../utils/validaciones.js");

const validarEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
})

//Obtener correos
contactoRoute.get("/correos",AsyncHandler(async(req, res)=>{
    try {
        const emails = await Email.find();
        res.json(emails);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los correos", error: error.message });
    }
}));


//Mandar correo
contactoRoute.post("/enviar-correo",AsyncHandler(async(req, res)=>{
    let {nombre,apellido,telefono,direccion_correo,destino,tipo_ayuda,mensaje}=req.body;

    // Sanitizar entradas
    nombre = sanitizeInput(nombre);
    apellido = sanitizeInput(apellido);
    telefono = sanitizeInput(telefono);
    direccion_correo = sanitizeInput(direccion_correo);
    mensaje = sanitizeInput(mensaje);

    if(hasMaliciousContent(nombre)||hasMaliciousContent(apellido)||hasMaliciousContent(telefono)||hasMaliciousContent(direccion_correo)||hasMaliciousContent(mensaje)) {
      return res.status(400).json({ message: "Entrada inválida." });
    }

    if (!direccion_correo || typeof direccion_correo !== 'string' || !validarEmail(direccion_correo)) {
        return res.status(400).json({ message: "Correo electrónico inválido" });
    }
    
    if(!validarTelefono(telefono)){
        return res.status(400).json({ message: "Teléfono no válido" });
    }
    // Extraer el dominio del correo
    const dominio = direccion_correo.split("@")[1];

    dns.resolveMx(dominio, async (err, direcciones) => {
        if (err || !direcciones || direcciones.length === 0) {
            return res.status(400).json({ message: "El dominio del correo no es válido" });
        }

        try{
            // Crear nuevo correo
            const nuevoCorreo  = new Email({
                nombre,
                apellido,
                telefono,
                direccion_correo,
                destino,
                tipo_ayuda,
                mensaje
            });

            await nuevoCorreo .save();

            // Configurar el correo para enviártelo a TI
            const mailOptions = {
                from: direccion_correo, 
                to: process.env.EMAIL_USER, 
                subject: `Nuevo mensaje de contacto: ${tipo_ayuda}`,
                text: `Has recibido un nuevo mensaje de contacto.\n\n
                    Nombre: ${nombre} ${apellido}\n
                    Teléfono: ${telefono}\n
                    Correo: ${direccion_correo}\n
                    Destino: ${destino}\n
                    Tipo de Ayuda: ${tipo_ayuda}\n
                    Mensaje: ${mensaje}`,
                html: `<p><strong>Has recibido un nuevo mensaje de contacto.</strong></p>
                        <p><strong>Nombre:</strong> ${nombre} ${apellido}</p>
                        <p><strong>Teléfono:</strong> ${telefono}</p>
                        <p><strong>Correo:</strong> ${direccion_correo}</p>
                        <p><strong>Destino:</strong> ${destino}</p>
                        <p><strong>Tipo de Ayuda:</strong> ${tipo_ayuda}</p>
                        <p><strong>Mensaje:</strong> ${mensaje}</p>`
            };

            // Enviar el correo a ti
            await transporter.sendMail(mailOptions);
            
            res.status(201).json({
                message: "Mensaje enviado exitosamente. Un agente de atención a clientes entrará en contacto con usted.",
            });

        }catch(err){
            console.log(err)
        }
    });
}));



module.exports = contactoRoute;



