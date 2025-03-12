const mongoose = require("mongoose");
const Counter = require("../Productos/counter.js");

//me genera un array del tipo de habitaciones y sus caracteristicas
const habitacionesSchema = mongoose.Schema({
  nombre_habitacion: { type: String, required: true },  
  precio_noche_sin_iva: { type: Number, required: true },
  precio_noche_con_iva: { 
    type: Number, 
    required: true,
    default: function () { return this.precio_noche_sin_iva * 1.16; } 
  },       

  personas_habitacion: { type: Number},

  descripcion_habitacion: { type: String, required: true },//descripcion general
  caracteristicas_habitacion: [{ type: String, required: true  }], // listado de todas las amenidades del cuarto
  fotos_habitacion: [{ type: String, required: true }], // URLs de imágenes sin límite
});


//me genera un array de los restaurantes y bares con sus caracteristicas
const bares_RestaurantesSchema = mongoose.Schema({
  nombre_establecimiento: { type: String, required: true}, 
  descripcion_establecimiento: { type: String, required: true },
  caracteristicas_establecimiento: [{ type: String, required: true  }], // listado de todas las amenidades del cuarto
  fotos_establecimiento:[{ type: String, required: true }], // URLs de imágenes sin límite
})

// Esquema de preguntas frecuentes
const preguntasFrecuentesSchema = mongoose.Schema({
  pregunta: { type: String, required: true },
  respuesta: { type: String, required: true }
});

const enumStars = [1,2,3,4,5];

const paqueteHoteleroSchema = new mongoose.Schema({
  nombre_hotel: { type: String, required: true },

  sku_paquete:{type: String,required: true,unique:true},

  habitacionItems: [habitacionesSchema],
  restauranteBarItems:[bares_RestaurantesSchema],

  descripcion_general: { type: String, required: true },//información general del hotel, un texto simple de 4 oraciones
  descripcion_específica: { type: String, required: true },//información detallada , mas de 3 parrafos
  caracteristicas: [{ type: String, required: true  }], // listado de todas las amenidades, como:  Estacionamiento gratis Wi-Fi gratis en zonas comunes Cancha de tenis TV en zonas comunes,
  categoria:[{
    type:String,
    required: true,
    enum: ["Resort", "Familiar", "Playa", "Todo Incluido", "Lujo", "Sólo Adultos", "Convenciones", "Sólo Adultos", "Convenciones","Pet Friendly","Romántico"], 
  }], //son las caterogias del hotel: si es acuatico si es adultos si es pet freindly cosas así

  //información de checkin, checkout,desayunos, cosas así
  itinerario_hotel: {
    check_in:{type:String, required: true},
    check_out:{type:String, required: true},
  },
  
  ubicacion: {
    direccion: { type: String, required: true },
    ciudad: { type: String, required: true },
    codigo_postal: { type: String, required: true },
    entidad : { type: String, required: true },
    pais: { type: String, required: true } 
  },

  transfer_hotel: {
    transporacion_incluida:{type: Boolean, },
    tipo_transfer:{type: String, enum: ['one way', 'roundtrip']},  
    one_way_transfer:{type: String, enum: ['llegada', 'salida']},
    clase_transfer:{type: String, enum: ['shared', 'private','dlx']},  
    vuelo_llegada:{type: String},
    vuelo_salida:{type: String},
  },
  
  recomendaciones_paquete: [{ type: String, required: true  }], // Guardamos como array para que sea una lista en el front
    
  agencia: { type: mongoose.Schema.Types.ObjectId, ref: "Agencia" },
  destino: { type: mongoose.Schema.Types.ObjectId, ref: "Destino" },

  estrellas: { type: Number, enum: enumStars},

  estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },

  fotos: [{ type: String, required: true }], // URLs de imágenes sin límite
  video: [{ type: String, required: true }], // URLs de videos sin límite
  preguntas_frequentes:[preguntasFrecuentesSchema],

  url_pack: { type: String },
  codigo_descuento: { type: mongoose.Schema.Types.ObjectId, ref: "CodigoDescuento" },
  ventas: { type: Number, default: 0 }, // Contador de ventas
}, { timestamps: true });

// Middleware para asignar SKU automático a los paquetes hoteleros
paqueteHoteleroSchema.pre("save", async function (next) {
  if (!this.sku_paquete) {
      const counter = await Counter.findOneAndUpdate(
          { name: "paquete" },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
      );
      this.sku_paquete = `PKG${String(counter.value).padStart(4, "0")}`;
  }
  next();
});




module.exports = mongoose.model("Paquete_Hotelero", paqueteHoteleroSchema)