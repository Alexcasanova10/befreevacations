const mongoose = require("mongoose");
 
const notificacionesWhatsappSchema = new mongoose.Schema({
    numero_whatsapp: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /^[0-9]{10,15}$/ 
    },
    mensaje: { 
        type: String, 
        required: true, 
        maxlength: 500, 
        trim: true 
    }
}, { timestamps: true });

module.exports = mongoose.model("Notificaciones_Whatsapp",notifiacionesWhatsapp )