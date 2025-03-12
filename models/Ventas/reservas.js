// // **Validación para asegurarse de que solo uno de los objetos (tour o paquete_hotelero) esté definido**
// reservaItemsSchema.pre('validate', function (next) {
//     if (this.tipo_reserva === 'tour' && !this.tour.tour_id) {
//         return next(new Error('Debe incluir un tour válido si el tipo de reserva es "tour".'));
//     }
//     if (this.tipo_reserva === 'paquete_hotelero' && !this.paquete_hotelero.paquete_Hotelero_id) {
//         return next(new Error('Debe incluir un paquete hotelero válido si el tipo de reserva es "paquete_hotelero".'));
//     }
//     // if (this.tour.tour_id && this.paquete_hotelero.paquete_Hotelero_id) {
//     //     return next(new Error('No se puede incluir un paquete hotelero en una reserva de tipo "tour".'));
//     // }
//     // if (this.tipo_reserva === 'paquete_hotelero' && this.tour.tour_id) {
//     //     return next(new Error('No se puede incluir un tour en una reserva de tipo "paquete_hotelero".'));
//     // }
//     next();
// });
    // imagen_producto: { type: String },
    // nombre_pax_principal: { type: String,  },
    // apellido_pax_principal: { type: String,  },
    // nombre_Acompaniantes: {
    //     nombre: { type: String},
    //     apellido: { type:String },
    // },
        
 
const mongoose = require("mongoose");

const reservaItemsSchema = new mongoose.Schema({
    // Propiedades de tour
    nombre_tour:{type:String},
    imagen_producto: { type: String },
    nombre_pax_principal: { type: String,  },
    apellido_pax_principal: { type: String, },
    nombre_Acompaniantes: {
        nombre: { type: String},
        apellido: { type:String },
    },
    cantidad_pax: { type: Number, },///limitado al modelo
    precio_por_pax_con_iva: { type: Number,  }, //
    fecha_actvidad:{type: Date,},
    
    tour_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
    },

    
    transfer_tour: {
        transporacion_incluida: { type: Boolean, },
        pick_up_point: { type: String }, 
        dropp_off_point: { type: String }
    }, 
    


    // Propiedade de hotel
    nombre_hotel:{type: String},

    fecha_inicio: { type: Date,  },
    fecha_fin: { type: Date,  },

    
    habitacion:{
        nombre_habitacion: { type: String },  
        personas_habitacion: { type: Number},
        precio_noche_con_iva: { type: Number,  }, 
    },

    paquete_Hotelero_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Paquete_Hotelero',  },
    
    transfer_hotel: {
        transporacion_incluida:{type: Boolean, },
        tipo_transfer:{type: String, enum: ['one way', 'roundtrip']},  
        one_way_transfer:{type: String, enum: ['llegada', 'salida']},
        clase_transfer:{type: String, enum: ['shared', 'private','dlx']},  
        vuelo_llegada:{type: String},
        vuelo_salida:{type: String},
    },
    
})





const ReservasSchema = new mongoose.Schema({
    tipo_reserva: { 
        type: String, 
        enum: ['tour', 'paquete_hotelero','combinado'], 
    },//combinado measn que la reserva tiene tanto tour_id  como paqueteHotelero_id
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'tipo_usuario' },
    tipo_usuario: { type: String, enum: ['cliente', 'agente_cc','guest'] }, 
    canal_venta: { type: String, enum: ['cliente', 'call_center', 'guest'], required: true }, // automatico,  si tipo usuario e scliente pues cnaale s cliente, pero si tipo usuario es agnte cc canal es callcenter 
    user_Guest: {type: Boolean},
    reservaItems: [reservaItemsSchema], // Lista de ítems en la reserva
    
    idAgente:{type:String},

    isPaid: { type: Boolean, default: false, required: true },
   
    paidAt: {
        type: Date,
    },

    estado_reserva: { type: String, enum: ['pagado', 'pendiente', 'cancelada'], default: 'pendiente' },
    
    costoFinal: { 
        type: Number, 
        required: true, 
        default: 0.0,
    }, 
    
    metodo_pago: { 
        type: String, 
        enum: ['Paypal', 'Strip','CashApp', 'ApplePay']
    },
    
    paymentResult: {
        id: { type: String },
        status: { type: String },
        updated_time: { type: String },
     },
    
    
    link_pago: { type: String },
    
    id_reserva: { type: String, required:true }, //serirarlo desde el 0000001


    
    email_pax: { type: String, required: true },
    numero_telefono: { type: String, required: true },

}, { timestamps: true });







// Validación para asegurarse de que tipo_reserva es consistente con los items
ReservasSchema.pre('validate', function (next) {
    const reserva = this;
    let tieneTour = false;
    let tienePaquete = false;
    
    reserva.reservaItems.forEach(item => {
        if (item.tour_id) tieneTour = true;
        if (item.paquete_Hotelero_id) tienePaquete = true;
    });

    if (tieneTour && tienePaquete) {
        reserva.tipo_reserva = "combinado";
    } else if (tieneTour) {
        reserva.tipo_reserva = "tour";
    } else if (tienePaquete) {
        reserva.tipo_reserva = "paquete_hotelero";
    } else {
        return next(new Error("La reserva debe contener al menos un tour o un paquete hotelero."));
    }
    
    next();
});


module.exports = mongoose.model('Reservas', ReservasSchema);
