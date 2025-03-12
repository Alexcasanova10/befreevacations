const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    telefono: { type: String },
    direccion_domicilio: { type: String },
    fecha_nacimiento: { type: Date },
    observaciones: { type: String },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    url_admin: { type: String },
    token_email: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    createdUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgenteCC",
    }],
  }, { timestamps: true });

module.exports = mongoose.model("Admins", adminSchema)