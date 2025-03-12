const mongoose = require("mongoose");
 

const LogsPagosSchema = new mongoose.Schema({
    id_reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'reservas', required: true },
    metodo_pago: { 
        type: String, 
        enum: ['paypal', 'stripe', 'visa', 'mastercard', 'amex', 'cashapp', 'applepay'],
        required: true
    },
    id_user: { type: mongoose.Schema.Types.ObjectId, refPath: 'tipo_usuario', required: true },
    tipo_usuario: { type: String, enum: ['cliente', 'agente_cc'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('LogsPagos', LogsPagosSchema);
