const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const cors = require("cors")
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const userAgent = require("express-useragent");

//Conexión a BD
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Base de datos conectada exitosamente"))
  .then((err) => {
    err;
  });


//Middleware que solo permite datos provenientes de nuestro frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true
}));
app.use(userAgent.express())

//Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
      // secure: process.env.NODE_ENV === "production", // Solo en HTTPS en producción
      httpOnly: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000 //30 dias
  }
}));

app.get('/', (req,res)=>{
  res.send("Hola mundo Be Free Vacations");
})


//Importar rutas
const userRoute = require("./routes/Usuarios/route_usuarios.js")
const clienteRoute = require("./routes/Usuarios/route_cliente.js"); 
const agenteRoute = require("./routes/Usuarios/route_agente_cc.js"); 
const contactoRoute = require("./routes/Contacto/route_contacto.js"); 
const whatsAppRoute = require("./routes/Contacto/route_contacto.js"); 
const destinosRoute = require("./routes/Producto/route_destinos.js"); 
const agenciasRoute = require("./routes/Producto/route_agencias.js"); 
const toursRoute = require("./routes/Producto/route_tours.js"); 
const paqueteRoute = require("./routes/Producto/route_paquetes_hoteleros.js"); 
const productosRoute = require("./routes/Producto/route_productos.js"); 
const reservasRoute = require("./routes/Ventas/route_reservas.js"); 

//Route usuarios
app.use("/api/usuarios",userRoute)

//Route cliente
app.use("/api/clientes",clienteRoute)

//Route agente cc
app.use("/api/agentes",agenteRoute)
 
//Route formulario contacto
app.use("/api/contacto",contactoRoute)

//Route form contacto de producto

//Route apis whatsapp
app.use("/api/whatsapp",whatsAppRoute)

//Route agencias
app.use("/api/agencias",agenciasRoute)

//Route destinos
app.use("/api/destinos",destinosRoute)


//Route paquetes hoteleros
app.use("/api/paquetes",paqueteRoute)
//Route tours
app.use("/api/tours",toursRoute)
//Route productos
app.use("/api/productos",productosRoute)

//Route reseñas
//Route códigos de descuento
//Route entradas


//route reservas
app.use("/api/reservas",reservasRoute)

//Route logs_pagos


//Route paypal;
app.use("/api/config/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});

app.get("/api/config/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});

// Route stripe




// Route apple play

// Route cashapp






//Ruta Error 404, pojerla hasta el final para no joder las demsa rutas
app.use((req, res, next) => {
  res.status(404).json({"message": "pagina no encontrada"});
});
 
app.listen(PORT || 9000, () => {
  console.log(`server en el  puerto ${PORT}`);
});


// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
