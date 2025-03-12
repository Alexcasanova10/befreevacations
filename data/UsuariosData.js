const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AgenteCC = require("../models/Usuarios/agentes_cc.js"); 

// Conexión a MongoDB (ajusta la URI según tu base de datos)
mongoose.connect("mongodb+srv://casanovaalex61:7HZXy2btYmlHPxhR@befreeotadb.sfzn7.mongodb.net/BeFreeOta?retryWrites=true&w=majority&appName=BeFreeOtaDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Conectado a MongoDB"))
.catch(err => console.error("Error al conectar a MongoDB:", err));

const agentes_cc = [
    {
        nombre: "Juan",
        apellido: "Perez",
        email: "juan@zambotours.com",
        password: "123",
        telefono: "9981555164",
        fecha_nacimiento: "1999-11-20",
        observaciones: "Owo",
        id_agente: "ZT001",
        estado: "Activo",
        reservas_creadas: [],
        agencia: "Zambo Tours"
    },
    {
        nombre: "Johny",
        apellido: "Soprano",
        email: "johnny@sopranotours.com",
        password: "123",
        telefono: "9981555164",
        fecha_nacimiento: "1999-11-20",
        observaciones: "Owo",
        id_agente: "SP001",
        estado: "Activo",
        reservas_creadas: [],
        agencia: "Soprano Excursions"
    }
];

const insertarAgentes = async () => {
    try {
        // Iterar sobre cada agente y encriptar la contraseña antes de guardarlo
        for (let agente of agentes_cc) {
            const salt = await bcrypt.genSalt(10);
            agente.password = await bcrypt.hash(agente.password, salt);
            
            await AgenteCC.create(agente);
            console.log(`Agente ${agente.nombre} guardado con contraseña encriptada.`);
        }
        
        console.log("Todos los agentes han sido insertados correctamente.");
        mongoose.connection.close(); // Cierra la conexión
    } catch (error) {
        console.error("Error insertando agentes:", error);
    }
};

// Ejecutar la función
insertarAgentes();
