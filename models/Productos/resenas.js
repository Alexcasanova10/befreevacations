const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  fecha_creacion: { type: Date, default: Date.now },
  fecha_edicion: { type: Date },
  estado: { type: String, enum: ["activa", "inactiva"], default: "activa" },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente" },
  contenido: { type: String, required: true },
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto" },
}, { timestamps: true });
  

module.exports = mongoose.model("Resenas", reviewSchema)