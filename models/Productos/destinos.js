const mongoose = require("mongoose");

const destinoSchema = new mongoose.Schema({
  tipo_destino: { type: String, enum: ["Los Cabos", "Cancún", "Riviera Maya","Tulum","Isla Mujeres","Cozumel"], required: true },
  imagen_destino:{type:String}
}, { timestamps: true });

module.exports = mongoose.model("Destino", destinoSchema)