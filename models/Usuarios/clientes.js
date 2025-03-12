const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String,
    required: function(){return !this.googleId} 
  },
  telefono: { type: String },
  direccion_domicilio: [
     calle = {type: String},

  ],
  cid: { type: String, unique: true }, // Customer ID
  fecha_nacimiento: { type: Date },
  nacionalidad: { type: String },
  estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
  name: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  url_cliente: { type: String },
  token_email: { type: String },
  genero: { type: String, enum: ["Masculino", "Femenino"]},
  resenas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resena" }],
  tours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tour" }],
  paquetes_hoteleros: [{ type: mongoose.Schema.Types.ObjectId, ref: "PaqueteHotelero" }],
  reservas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reservas" }],
}, { timestamps: true });




//validate password match or not
clienteSchema.methods.matchPassword = async function (enterPassword) {
    const isMatch = await bcrypt.compare(enterPassword, this.password)
    console.log("Comparando contraseñas:", enterPassword, this.password, isMatch);
    return isMatch;
};

  //register passwrod hash and store
  clienteSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next()
  });


  // Middleware para asignar el CID automáticamente
  clienteSchema.pre("save", async function (next) {
  if (!this.cid) {
      const counter = await Counter.findOneAndUpdate(
          { name: "clientes" },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
      );
      this.cid = `CUST-${new Date().getFullYear()}-${String(counter.value).padStart(5, "0")}`;
  }
  next();
});


  module.exports= mongoose.model("Cliente",clienteSchema);