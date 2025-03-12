const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const codigosDescuentos = new mongoose.Schema({
    codigo_descuento: { type: String, required: true, unique: true },
    cantidad_descuento: { type: Number, required: true },
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Productos', required: true } // Cambio de nombre para mayor claridad
}, { timestamps: true });

module.exports = mongoose.model('CodigosDescuento', codigosDescuentos);
