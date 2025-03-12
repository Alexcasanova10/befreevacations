const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  tipo_producto: { type: String, enum: ["tour", "paquete_hotelero"], required: true },
  producto_id: { type: mongoose.Schema.Types.ObjectId, refPath: "tipo_producto" },
  agencia: { type: mongoose.Schema.Types.ObjectId, ref: "Agencia" },
}, { timestamps: true });

module.exports = mongoose.model("Productos", productoSchema);


//filtro de ordenar por precio mayor a menor,, ordenar por price range slider de 0 a precio mayor, ordenar por categorias, ordenar por estrellas en caso de paquets hoteleros