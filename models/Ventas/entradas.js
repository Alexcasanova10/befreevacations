const mongoose = require("mongoose");

const EntradasSchema = new mongoose.Schema({
    id_reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'reservas', required: true },
    url_documento: { type: String, required: true },
    tipo_entrada: { type: String, enum: ['tour', 'paquete_hotelero'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Entradas', EntradasSchema);

