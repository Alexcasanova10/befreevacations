const mongoose = require("mongoose");
const Counter = require("../Productos/counter.js");

 
const tourSchema = new mongoose.Schema(
  {
    nombre_tour: { type: String, required: true },
    url_tour: { type: String }, // Guarda la URL del tour
    
    sku_tour:{type: String,required: true,unique:true},


    destino: {type: mongoose.Schema.Types.ObjectId, ref: "Destino", required: true }, // Referencia a Destino
    
    limite_pax:{
      type: Number
    },

    ubicacion:{
      link_maps:{type: String},
      direccion:{type: String}      
    }, // string de maps para poner el hotel
    
 
    categoria:[{
      type:String,
      required: true,
      enum: ["Aventura","Actividades Acuáticas","Privado","Ecoturismo","Tirolesas","Snorkel","Ruinas Mayas","Cenotes","Yates y Catamaranes","Nado con Delfines"] 
    }], //son las caterogias del tour: si es acuatico si es adultos si es pet freindly cosas así

    hora_inicio: { type: String },
    
    duracion_horas: { 
      type: Number,
      required: true 
    },

    transfer_tour: {
      transporacion_incluida: { type: Boolean, },
      pick_up_point: { type: String }, 
      dropp_off_point: { type: String }
    }, 
  
   

    precio_por_pax_sin_iva: { type: Number, required: true },
    precio_por_pax_con_iva: { 
      type: Number, 
      required: true,
      default: function () { return this.precio_por_pax_sin_iva * 1.16; } 
    }, // Se calcula automáticamente
    
    
    dias_semana_disponibles: [{ 
      type: String, 
      enum: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], 
      required: true 
    }], // Array de días disponibles
    
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    
    descripcion_general: { type: String, required: true },
    descripcion_específica: { type: String, required: true },
    caracteristicas_incluidas: [{ type: String, required: true  }], // Guardamos como array para que sea una lista en el front
    recomendaciones: [{ type: String, required: true  }], // Guardamos como array para que sea una lista en el front
    
    edad_minima: { type: Number, default: 0 },
    ninios_permitidos: { type: Boolean, default: false },
    embarazadas_permitidas: { type: Boolean, default: false },
    tercera_edad_permitida: { type: Boolean, default: false },
    condicion_fisica_requerida: { type: Boolean, default: false },
    idioma_tour: [{ 
      type: String, 
      enum: ["Español", "Inglés", "Francés", "Alemán", "Italiano"],
      required: true 
    }], // Array de idiomas disponibles
    
    
    agencia: { type: mongoose.Schema.Types.ObjectId, ref: "Agencias" }, // Referencia a la agencia
    estrellas: { type: Number, default: 0 },

    fotos: [{ type: String, required: true }], // URLs de imágenes sin límite
    video: [{ type: String, required: true }], // URLs de videos sin límite

    codigo_descuento: { type: mongoose.Schema.Types.ObjectId, ref: "CodigoDescuento" },
    ventas: { type: Number, default: 0 }, // Contador de ventas

  },
  { timestamps: true }
);


// Middleware para asignar SKU automático a los tours
tourSchema.pre("save", async function (next) {
  if (!this.sku_tour) {
      const counter = await Counter.findOneAndUpdate(
          { name: "tour" },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
      );
      this.sku_tour = `TOUR${String(counter.value).padStart(4, "0")}`;
  }
  next();
});


module.exports = mongoose.model("Tour", tourSchema);
