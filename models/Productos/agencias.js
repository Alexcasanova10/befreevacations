const mongoose = require("mongoose");

const agenciaSchema = new mongoose.Schema({
  nombre_agencia: { type: String, required: true },
  razon_social: { type: String, required: true },
  rfc: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String },
  domicilio: { type: String },
  agentes_cc: [{ type: mongoose.Schema.Types.ObjectId, ref: "AgenteCC" }],
  productos_agencia: [{ type: mongoose.Schema.Types.ObjectId, ref: "Producto" }],
}, { timestamps: true });

module.exports = mongoose.model("Agencias", agenciaSchema)