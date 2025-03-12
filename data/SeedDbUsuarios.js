 
const mongoose = require("mongoose");
 const AgenteCC = require("../models/Usuarios/agentes_cc.js");
 const UsuariosData = require("../data/UsuariosData.js");
 
mongoose.connect("mongodb+srv://casanovaalex61:7HZXy2btYmlHPxhR@befreeotadb.sfzn7.mongodb.net/BeFreeOta?retryWrites=true&w=majority&appName=BeFreeOtaDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Conectado a MongoDB");

    // Limpiar la base de datos
    await AgenteCC.deleteMany({});
  

    // Insertar los datos
    await AgenteCC.insertMany(UsuariosData.agentes_cc);

    console.log("Datos insertados correctamente");
    mongoose.connection.close();
}).catch(err => console.error("Error conectando a MongoDB", err));
