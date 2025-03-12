const mongoose = require("mongoose");

const contactoPaquetesSchema = new mongoose.Schema({
    id_paquete: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Paquete_Hoteleros", 
        required: true 
    },
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    correo: { 
        type: String, 
        required: true, 
        trim: true, 
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/ 
    },
    telefono: { 
        type: String, 
        match: /^[0-9]{10,15}$/, 
        trim: true 
    },
    mensaje: { type: String, required: true, maxlength: 500, trim: true },
    motivo_duda: { 
        type: String, 
        enum: ["información general", "cotización específica"], 
        required: true 
    }
}, { timestamps: true });

// Agregar un campo virtual para obtener el nombre del tour directamente
contactoPaquetesSchema.virtual("nombre_hotel", {
    ref: "Paquete_Hoteleros",
    localField: "id_paquete",
    foreignField: "_id",
    justOne: true,
    options: { select: "nombre_hotel" } // Solo traer el nombre del hotel
});

// Configurar el esquema para incluir virtuals en JSON y objetos
contactoPaquetesSchema.set("toObject", { virtuals: true });
contactoPaquetesSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Contacto_Paquetes", contactoPaquetesSchema);
