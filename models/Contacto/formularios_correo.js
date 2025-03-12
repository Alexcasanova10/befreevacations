const mongoose = require("mongoose");
 
const formularioCorreoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    telefono: { 
        type: String, 
        match: /^[0-9]{10,15}$/, 
        trim: true 
    },
    direccion_correo: { 
        type: String, 
        required: true, 
        trim: true, 
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/ 
    },
    destino:{
       type: String,
       enum: ["Cancún", "Los Cabos"],
       required: true, 
    },
    tipo_ayuda:{
        type: String,
        enum: ["Cotización Específica", "Información General","Agendar un servicio", "Reportar un servicio", "Convertirse en socio"],
        required: true, 
    },
    mensaje: { type: String, required: true, maxlength: 500, trim: true }
}, { timestamps: true });



module.exports= mongoose.model("Formularios_Correo", formularioCorreoSchema)


