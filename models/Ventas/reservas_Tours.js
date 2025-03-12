const mongoose = require("mongoose");


const ReservasToursSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'tipo_usuario' },
    tipo_usuario: { type: String, enum: ['cliente', 'agente_cc'] }, 
    canal_venta: { type: String, enum: ['cliente', 'call_center', 'guest'], required: true }, // automatico,  si tipo usuario e scliente pues cnaale s cliente, pero si tipo usuario es agnte cc canal es callcenter 
    user_Guest: {type: Boolean},
    reservaItems: [reservaItemsSchema], // Lista de ítems en la reserva
    
    isPaid: { type: Boolean, default: false },
    estado_reserva: { type: String, enum: ['pagado', 'pendiente', 'cancelada'], default: 'pendiente' },
    costo_total_con_iva: { type: Number, required: true },
    link_pago: { type: String },

    id_reserva: { type: String, required:true }, //serirarlo desde el 0000001
                                                                            
    email_pax: { type: String, required: true },
    numero_telefono: { type: String, required: true },
    metodo_pago: { 
        type: String, 
        enum: ['paypal', 'stripe','cashapp', 'applepay']
    },
    id_api_bancaria: { type: String }
})
module.exports = mongoose.model('reservas_Tours', ReservasSchema);
