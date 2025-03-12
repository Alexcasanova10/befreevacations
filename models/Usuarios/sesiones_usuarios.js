const mongoose = require("mongoose");

const sesionesUsuariosSchema = new mongoose.Schema(
  {
    id_tipo_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    tipo_usuario: {
      type: String,
      enum: ["cliente", "agente_cc", "admin"],
      required: true,
    },
    dispositivo: { type: String, required: true },
    ip: { type: String, required: true },
    hora_login: { type: Date, default: Date.now, required: true },
    hora_logout: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SesionesUsuario", sesionesUsuariosSchema);
