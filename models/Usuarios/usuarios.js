const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  tipo_usuario: {
    type: String,
    enum: ["Cliente", "AgenteCC", "Admins"],
    required: true,
  },
  info_user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "tipo_usuario",
  },
},
{ timestamps: true }

);


module.exports = mongoose.model("Usuario", usuarioSchema);
