const express = require("express");
const clienteRoute = express.Router();
const AsyncHandler = require("express-async-handler");
const Cliente = require("../../models/Usuarios/clientes.js");
const dns = require("dns");
const Usuarios = require("../../models/Usuarios/usuarios.js");
const SesionUsuario = require("../../models/Usuarios/sesiones_usuarios.js");
const protect = require("../../middleware/authCliente.js")
const generateToken = require("../../token/tokenGenerate.js");
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars")
const refreshMiddleware = require("../../middleware/refereshMiddleware.js")
require('dotenv').config();
const useragent = require("user-agent");

const { sanitizeInput, hasMaliciousContent, limiter } = require("../../utils/security.js");
const {validarDominioEmail, validarTelefono, validarEmailValidator} =  require("../../utils/validaciones.js");

const validarEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};



//Registrar cliente
clienteRoute.post("/registrarse",limiter, AsyncHandler(async (req, res) => {
    let { nombre, apellido, email, password, telefono } = req.body;
    
    // Sanitizar entradas
    nombre = sanitizeInput(nombre);
    apellido = sanitizeInput(apellido);
    email = sanitizeInput(email);
    telefono = sanitizeInput(telefono);

    // Prevenir inyecciones peligrosas
    if (hasMaliciousContent(nombre) || hasMaliciousContent(apellido)) {
        return res.status(400).json({ message: "Entrada inválida." });
    }


    // Validar el formato del email
    if (!validarEmail(email)) {
        return res.status(400).json({ message: "Correo electrónico no válido" });
    }
    
    if(!validarTelefono){
        return res.status(400).json({ message: "Teléfono no válido" });
    }
    // Extraer el dominio del correo
    const dominio = email.split("@")[1];

    // Verificar si el dominio tiene registros MX
    dns.resolveMx(dominio, async (err, direcciones) => {
        if (err || !direcciones || direcciones.length === 0) {
            return res.status(400).json({ message: "El dominio del correo no es válido" });
        }

        // Verificar si el cliente ya existe
        const clienteExistente = await Cliente.findOne({ email });
        if (clienteExistente) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }

        // Crear nuevo cliente
        const nuevoCliente = new Cliente({
            nombre,
            apellido,
            email,
            password,
            telefono,
            estado: "inactivo", // Hasta que verifique el correo
            token_email: generateToken(email), // Guardamos un token para verificación
        });

        await nuevoCliente.save();

        // Crear documento en la colección Usuarios referenciando al cliente
        const nuevoUsuario = new Usuarios({
            tipo_usuario: "Cliente",
            info_user: nuevoCliente._id
        });

        // Guardar el usuario en la BD
        await nuevoUsuario.save();
        const token = generateToken(nuevoCliente._id);

        req.session.cliente = {
            id: nuevoCliente._id,
            nombre: nuevoCliente.nombre,
            email: nuevoCliente.email
        };

        // Configurar cookie con el token
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        });

        // Enviar correo de verificación
        await enviarCorreoVerificacion(nuevoCliente.email, nuevoCliente.token_email, nuevoCliente.nombre);

        res.status(201).json({
            message: "Registro exitoso. Hemos enviado un correo de verificación a tu cuenta.",
            cliente: {
                _id: nuevoCliente._id,
                nombre: nuevoCliente.nombre,
                apellido: nuevoCliente.apellido,
                email: nuevoCliente.email
            }
        });
    });
}));

//Enviar correo de verificación al registrarse
const enviarCorreoVerificacion = async(email,token,nombre)=>{
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth:{
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    })

    //Template
    const templatePath = path.join(__dirname, "../../templates/verificarCorreo.html");
    const source = fs.readFileSync(templatePath, "utf-8");

    const templateMail = handlebars.compile(source);

    const html= templateMail({
        nombre: nombre,
        url_verificacion: `http://localhost:9000/api/clientes/verificar-email?token=${token}`
    });



    const mensaje = {
        from: `"Soporte Be Free Tours`,
        to: email,
        subject: "Verifica tu cuenta en Be Free Tours",
        html:html,
    };
    await transporter.sendMail(mensaje);
}

// Ruta para verificar email
clienteRoute.get("/verificar-email", async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Token inválido o faltante.");
    }

    try {
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const cliente = await Cliente.findOne({ token_email: token });

        if (!cliente) {
            return res.status(400).send("Token inválido o usuario no encontrado.");
        }

        // Activar la cuenta
        cliente.estado = "activo";
        cliente.token_email = null; // Eliminar el token después de usarlo
        await cliente.save();

        res.send("<h1>¡Cuenta verificada correctamente!</h1>");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error en el servidor.");
    }
});


//Login cliente
clienteRoute.post("/login",limiter, AsyncHandler(async (req,res)=>{
    let {email, password} = req.body;
    const cliente = await Cliente.findOne({email})


    // Sanitizar entradas
    email = sanitizeInput(email);
    password = sanitizeInput(password);

    // Prevenir inyecciones peligrosas
    if (hasMaliciousContent(email) || hasMaliciousContent(password)) {
        return res.status(400).json({ message: "Entrada inválida." });
    }

    // Validar email
    if (!validarEmail(email)) {
        return res.status(400).json({ message: "Correo electrónico no válido" });
    }


    // Verificar si la cuenta está activa
    if (cliente.estado !== "activo") {
        return res.status(403).json({ message: "Cuenta inactiva" });
    }

    if (cliente && (await cliente.matchPassword(password))) {
        req.session.cliente = {
            _id: cliente.id,
            nombre: cliente.nombre,
            email: cliente.email,
        };

    }else{
        res.status(401);
        throw new Error("Correo o contraseña invalida")
    }

    const token = jwt.sign({ id: cliente._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

      // Generar el Refresh Token (expira en 30 días)
      const refreshToken = jwt.sign({ id: cliente._id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "30d",
    }); 


      // Guardar Refresh Token en una cookie httpOnly
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Solo en HTTPS en producción
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    const dispositivo = `${req.useragent.platform} - ${req.useragent.browser}`;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;


    await SesionUsuario.create({
        id_tipo_user: cliente._id,
        tipo_usuario: "cliente",
        dispositivo,
        ip,
        hora_login: new Date(),
    });
    console.log(SesionUsuario)

    res.status(200).json({
        message: "Inicio de sesión exitoso",
        token,
        cliente: {
            _id: cliente._id,
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            email: cliente.email
        }
    });

}))
 

clienteRoute.get("/refresh", refreshMiddleware);

//logout cliente
clienteRoute.post("/logout", AsyncHandler(async (req, res) => {
    if (!req.session.cliente) {
        return res.status(401).json({ message: "No hay sesión activa" });
    }

    // Actualizar la hora de logout en la base de datos
    await SesionUsuario.findOneAndUpdate(
        { id_tipo_user: req.session.cliente._id, hora_logout: null },
        { hora_logout: new Date() }
    );

    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "No se pudo cerrar la sesión" });
        }
        res.clearCookie("connect.sid");
        res.clearCookie("token");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logout exitoso" });
    });
}));



//recuperar contraseña
clienteRoute.post("/recuperar", AsyncHandler(async(req,res)=>{
    const {email} = req.body;

    const cliente = await Cliente.findOne({email});
  
    if(!cliente){
        res.status(404);
        throw new Error('Usuario no encontrado')
    }
  
    //generar token
    const token = crypto.randomBytes(20).toString('hex');
    cliente.resetPasswordToken = token;
    cliente.resetPasswordExpires = Date.now() + 3600000;
    await cliente.save();
  
    //configuracion correo
    const transporter= nodemailer.createTransport({
        service: 'Gmail',
        auth:{
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    }) 
  
    let nombre = cliente.name;
    const mailOptions = {
        to: cliente.email,
        from: 'Soporte Be Free Tours',
        subject: `Hola ${nombre}, tu token de recuperación de contraseña está aquí` ,
        text: `Su token de recuperación es el siguiente: ${token}`
    };
  
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Correo de recuperación enviado' });
}))

//token recuperación de contraseña
clienteRoute.post('/reset/:token', AsyncHandler(async(req,res)=>{
    const { token } = req.params;
    const { password } = req.body;
  
    const cliente = await Cliente.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });
  
    if (!cliente) {
        res.status(400);
        throw new Error('Token inválido o expirado');
    }
  
    // user.password = await bcrypt.hash(password, 10);
    cliente.password = password;
    cliente.resetPasswordToken = undefined;
    cliente.resetPasswordExpires = undefined;
    await cliente.save();
  
    res.json({ 
        message: 'Contraseña actualizada'
     });
}))


//perfil nos devuelve todos los datos personales PDTE AÑADIR NUEVO MIDDLEWARE que requirea auth de session y token con login para entrar a esta ruta.
clienteRoute.get("/perfil", protect, AsyncHandler(async (req,res)=>{
    const cliente = await Cliente.findById(req.cliente._id);
    if (cliente) {
        res.json({
          _id: cliente._id,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          email: cliente.email,
          password: cliente.password,
          createdAt: cliente.createdAt,
          telefono: cliente.telefono,
          direccion_domicilio: cliente.direccion_domicilio,
          fecha_nacimiento: cliente.fecha_nacimiento,
          nacionalidad: cliente.nacionalidad,
          genero: cliente.genero
        });
    } else {
    res.status(404);
    throw new Error("USUARIO NO ENCONTRADO");
    }
}));

//patch para editar datos personales telefono con filtro de verificacion 10 digits direccion_domicilio ciudad estado  fecha_nacimiento(filtro de mayor de 18 años) nacionalidad con listado de paises  genero // pendiente modificarla cuando tengamos login de goooogle
clienteRoute.patch("/perfil/datos-personales",protect,AsyncHandler(async (req,res)=>{
    const cliente = await Cliente.findById(req.cliente._id);
 

    if(cliente){
        cliente.nombre = req.body.nombre || cliente.nombre;
        cliente.apellido = req.body.apellido || cliente.apellido;
        cliente.telefono = req.body.telefono || cliente.telefono;
        cliente.nacionalidad = req.body.nacionalidad|| cliente.nacionalidad;
        cliente.genero = req.body.genero ||cliente.genero;
        
        if(req.body.fecha_nacimiento){
            const fechaValida = new Date(req.body.fecha_nacimiento);
            if(isNaN(fechaValida.getTime())){
                return res.status(400).json({ message: "Formato de fecha inválido. Usa YYYY-MM-DD" });
            }
            cliente.fecha_nacimiento= fechaValida
        }

        if(req.body.password){
            const salt = await bcrypt.genSalt(10);
            cliente.password = await bcrypt.hash(req.body.password, salt); 
        }

        const clienteActualizado = await cliente.save();
        res.json({
            _id: clienteActualizado._id,
            nombre:clienteActualizado.nombre,
            apellido: clienteActualizado.apellido,
            telefono: clienteActualizado.telefono,
            fecha_nacimiento: clienteActualizado.fecha_nacimiento,
            nacionalidad:clienteActualizado.nacionalidad,
            genero:clienteActualizado.genero
        })

    } else {
      res.status(404);
      throw new Error("Error al actualizar la información");
    }

}))

//get sesiones activas, involucrando modelo sesiones_usuario
clienteRoute.get("/perfil/sesiones-activas",protect,AsyncHandler(async (req, res) => {
      const sesiones = await SesionUsuario.find({
        id_tipo_user: req.cliente._id,
        hora_logout: null, //
      });
  
      res.status(200).json({
        sesiones: sesiones.map((s) => ({
          id: s._id,
          dispositivo: s.dispositivo,
          ip: s.ip,
          hora_login: s.hora_login,
          logout_url: `/perfi/sesiones-activas/logout/${s._id}`, 
        })),
      });
    })
  );
  

//ceirra las sesiones activas en otros dispositivos 
clienteRoute.post("/perfil/sesiones-activas/logout/:sesionId",protect, AsyncHandler(async (req, res) => {
      const sesion = await SesionUsuario.findOne({
        _id: req.params.sesionId,
        id_tipo_user: req.cliente._id,
        hora_logout: null,
      });
  
      if (!sesion) {
        return res.status(404).json({ message: "Sesión no encontrada o ya cerrada" });
      }
  
      sesion.hora_logout = new Date();
      await sesion.save();
  
      res.status(200).json({ message: "Sesión cerrada exitosamente" });
    })
  );
  

//get reseñas
clienteRoute.get("/perfil/resenas",protect, AsyncHandler(async (req,res)=>{

}))

//crear reseña de un producto
clienteRoute.post("/perfil/historial/:id/resena",protect, AsyncHandler(async (req,res)=>{

}))

//ver reservas
clienteRoute.get("/perfil/historial",protect, AsyncHandler(async (req,res)=>{

})) 
//ver reservas (single)
clienteRoute.get("/perfil/historial/:id",protect, AsyncHandler(async (req,res)=>{

})) 

module.exports = clienteRoute;




 














 