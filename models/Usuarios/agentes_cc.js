const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const agenteCCSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    telefono: { type: String },
    fecha_nacimiento: { type: Date },
    observaciones: { type: String },
    id_agente: { type: String, required: true }, // Identificador único de la empresa
    estado: { type: String, enum: ["Activo", "Inactivo"], default: "Activo" },
    reservas_creadas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reserva" }],
    token_email: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    agencia: { type: mongoose.Schema.Types.ObjectId, ref: "Agencias", required: true },

  }, { timestamps: true });
  


  
//validate password match or not
agenteCCSchema.methods.matchPassword = async function (enterPassword) {

    const isMatch = await bcrypt.compare(enterPassword, this.password)
    console.log("Comparando contraseñas:", enterPassword, this.password, isMatch);

    return isMatch;
};

//register passwrod hash and store
agenteCCSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
    return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next()
});



module.exports = mongoose.model("AgenteCC", agenteCCSchema)








