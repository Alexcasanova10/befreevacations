 const mongoose = require("mongoose");

const contactoToursSchema = new mongoose.Schema({
    id_tour: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "tours", 
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
contactoToursSchema.virtual("nombre_tour", {
    ref: "tours",
    localField: "id_tour",
    foreignField: "_id",
    justOne: true,
    options: { select: "nombre_tour" } // Solo traer el nombre del tour
});

// Configurar el esquema para incluir virtuals en JSON y objetos
contactoToursSchema.set("toObject", { virtuals: true });
contactoToursSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Contacto_Tours", contactoToursSchema);
