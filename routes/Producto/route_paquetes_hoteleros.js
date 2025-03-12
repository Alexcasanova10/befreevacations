const express = require("express");
const paqueteRoute = express.Router();
const AsyncHandler = require("express-async-handler");
const Agencia = require("../../models/Productos/agencias.js");
const Paquetes = require("../../models/Productos/paquetes_hoteleros.js");
const Destino = require("../../models/Productos/destinos.js");

const dns = require("dns");
const nodemailer = require('nodemailer');
const { validarEmail, validarDominioEmail, validarTelefono } = require("../../utils/validaciones.js");
const contactoPaquetes = require("../../models/Contacto/formularios_contacto_paquetes.js");

const slugify = require("slugify");

const {sanitizeInput, hasMaliciousContent, limiter } = require("../../utils/security.js");

const mongoose = require("mongoose");


//obtener todos los hoteles, con filtro de ordenamiento de precio (mayor-menor), por cateogira, por estrellas y que muestre los hoteles activos activos

//Obtener packs hotleeros por destino **Pendiente

paqueteRoute.get("/obtener-paquetes", AsyncHandler(async (req, res) => {
    try {
        let query = { estado: "activo" }; // Solo mostrar paquetes activos

        // FILTRO POR CATEGORÍA
        if (req.query.categoria) {
            query.categoria = req.query.categoria; // Filtrar por una categoría específica
        }

        // FILTRO POR ESTRELLAS DEL HOTEL
        if (req.query.estrellas) {
            query.estrellas = parseInt(req.query.estrellas); // Convertir a número
        }

          // FILTRO POR DESTINO (tipo_destino)**new
        if (req.query.destino) {
        const destinoEncontrado = await Destino.findOne({ tipo_destino: req.query.destino });
            if (destinoEncontrado) {
                query.destino = destinoEncontrado._id;
            } else {
                return res.status(404).json({ message: "Destino no encontrado" });
            }
        }



        // ORDENAMIENTO POR PRECIO DE HABITACIÓN (MAYOR A MENOR / MENOR A MAYOR)
        let sort = {};
        if (req.query.precio) {
            if (req.query.precio === "asc") {
                sort["habitacionItems.precio_noche_sin_iva"] = 1; // Menor a mayor
            } else if (req.query.precio === "desc") {
                sort["habitacionItems.precio_noche_sin_iva"] = -1; // Mayor a menor
            }
        }


          // EJECUTAR CONSULTA CON POPULATE**new
          const paquetes = await Paquetes.find(query)
          .sort(sort)
          .populate("destino", "tipo_destino"); // Solo traemos el tipo_destino

        // EJECUTAR CONSULTA CON FILTROS Y ORDENAMIENTO
        // const paquetes = await Paquetes.find(query).sort(sort);

        res.json(paquetes);
    } catch (error) {
        res.status(500).json({ message: "No se pudo obtener los paquetes", error: error.message });
    }
}));




//obtener información single tour
paqueteRoute.get("/obtener-paquetes/:id",AsyncHandler(async(req,res)=>{
    try {
        const paquetes = await Paquetes.findById(req.params.id);
        res.json(paquetes);
    } catch (error) {
        res.status(500).json({ message: "No se pudo obtener el paquete"});
        console.log/(error.message);
    }
}));

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
})

//enviar correo de contacto de tour
paqueteRoute.post("/obtener-paquetes/:id/enviar-correo", AsyncHandler(async (req, res) => {
    const id_paquete = req.params.id;
    let { nombre, apellido, correo, telefono, mensaje, motivo_duda } = req.body;

    nombre =sanitizeInput(nombre);
    apellido= sanitizeInput(apellido);
    correo= sanitizeInput(correo);
    telefono= sanitizeInput(telefono);
    mensaje= sanitizeInput(mensaje);

    // Prevenir inyecciones peligrosas
    if (hasMaliciousContent(nombre) || hasMaliciousContent(apellido)|| hasMaliciousContent(correo)|| hasMaliciousContent(telefono)||hasMaliciousContent(mensaje)) {
        return res.status(400).json({ message: "Entrada inválida." });
    }

    if (!correo || typeof correo !== "string" || !validarEmail(correo)) {
        return res.status(400).json({ message: "Correo electrónico inválido" });
    }
    if(!telefono|| typeof telefono !== "string" || !validarTelefono(telefono) ){
        return res.status(400).json({ message: "Teléfono inválido" });
    }
    
    // Obtener el nombre del tour
    const paquete = await Paquetes.findById(id_paquete).select("nombre_hotel");
    if (!paquete) {
        return res.status(404).json({ message: "Hotel no encontrado" });
    }

    // Extraer el dominio del correo
    const dominio = correo.split("@")[1];

    dns.resolveMx(dominio, async (err, direcciones) => {
        if (err || !direcciones || direcciones.length === 0 ) {
            return res.status(400).json({ message: "El dominio del correo no es válido" });
        }

        try {
            // Crear y guardar el contacto en la base de datos
            const nuevoCorreo = new contactoPaquetes({
                id_paquete,
                nombre,
                apellido,
                correo,
                telefono,
                mensaje,
                motivo_duda
            });

            await nuevoCorreo.save();

            // Configurar el correo para enviártelo a TI
            const mailOptions = {
                from: correo, 
                to: process.env.EMAIL_USER, 
                subject: `Nuevo mensaje de contacto sobre el Hotel: ${paquete.nombre_hotel}`,
                text: `Has recibido un nuevo mensaje de contacto.\n\n
                    Nombre: ${nombre} ${apellido}\n
                    Teléfono: ${telefono}\n
                    Correo: ${correo}\n
                    Hotel: ${paquete.nombre_hotel}\n
                    Motivo de la duda: ${motivo_duda}\n
                    Mensaje: ${mensaje}`,
                html: `<p><strong>Has recibido un nuevo mensaje de contacto.</strong></p>
                        <p><strong>Nombre:</strong> ${nombre} ${apellido}</p>
                        <p><strong>Teléfono:</strong> ${telefono}</p>
                        <p><strong>Correo:</strong> ${correo}</p>
                        <p><strong>Hotel:</strong> ${paquete.nombre_hotel}</p>
                        <p><strong>Motivo de la duda:</strong> ${motivo_duda}</p>
                        <p><strong>Mensaje:</strong> ${mensaje}</p>`
            };

            // Enviar el correo
            await transporter.sendMail(mailOptions);

            res.status(201).json({
                message: "Mensaje enviado exitosamente. Un agente de atención a clientes entrará en contacto con usted a la brevedad.",
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Error al procesar la solicitud." });
        }
    });
}));


//crear paquetes
paqueteRoute.post("/crear-paquete", AsyncHandler(async (req, res) => {
    try {
        const {
            nombre_hotel, descripcion_general, descripcion_específica, caracteristicas,
            categoria, itinerario_hotel, ubicacion, recomendaciones_paquete, agencia, destino, estrellas, fotos, video, preguntas_frecuentes,
            habitacionItems, restauranteBarItems
        } = req.body;

        // Buscar destino por nombre
        const destinoEncontrado = await Destino.findOne({ tipo_destino: destino });
        if (!destinoEncontrado) {
            return res.status(400).json({ message: "Destino no encontrado" });
        }

        // Buscar agencia por nombre
        const agenciaEncontrada = await Agencia.findOne({ nombre_agencia: agencia });
        if (!agenciaEncontrada) {
            return res.status(400).json({ message: "Agencia no encontrada" });
        }

        // Crear nuevo paquete hotelero
        const nuevoPaquete = new Paquetes({
            nombre_hotel, descripcion_general, descripcion_específica, caracteristicas,
            categoria, itinerario_hotel, ubicacion, recomendaciones_paquete,
            agencia: agenciaEncontrada._id, destino: destinoEncontrado._id,
            estrellas, fotos, video, preguntas_frecuentes,
            habitacionItems, restauranteBarItems 
        });

        // Guardar en la base de datos
        await nuevoPaquete.save();
        
       
        const url_updated = `http://localhost:9000/api/paquetes/obtener/${nuevoPaquete._id}`
        //actualizar url
        nuevoPaquete.url_pack = url_updated;

        await nuevoPaquete.save();

        res.status(201).json({ message: "Paquete creado exitosamente", paquete: nuevoPaquete });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear el paquete hotelero" });
    }
}));

// Actualizar información del tour
paqueteRoute.patch("/actualizar-paquete/:id", AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const datosActualizados = req.body;


    const paqueteExistente = await Paquetes.findById(id);
        if (!paqueteExistente) {
            return res.status(404).json({ message: "Paquete hotelero no encontrado" });
    }


    // Si el destino cambia, obtener el ID correcto
    if (datosActualizados.destino) {
        const destinoEncontrado = await Destino.findOne({ tipo_destino: datosActualizados.destino });
        if (!destinoEncontrado) {
            return res.status(400).json({ message: "Destino no encontrado" });
        }
        datosActualizados.destino = destinoEncontrado._id;
    }

    // Si la agencia cambia, obtener el ID correcto
    if (datosActualizados.agencia) {
        const agenciaEncontrada = await Agencia.findOne({ nombre_agencia: datosActualizados.agencia });
        if (!agenciaEncontrada) {
            return res.status(400).json({ message: "Agencia no encontrada" });
        }
        datosActualizados.agencia = agenciaEncontrada._id;
    }

    // Si se actualiza el precio de una habitación, recalcular el precio con IVA
    if (datosActualizados.habitacionItems) {
        datosActualizados.habitacionItems = datosActualizados.habitacionItems.map(habitacion => ({
            ...habitacion,
            precio_noche_con_iva: habitacion.precio_noche_sin_iva * 1.16
        }));
    }

    const paqueteActualizado = await Paquetes.findByIdAndUpdate(id, datosActualizados, { new: true });

    if (!paqueteActualizado) {
        return res.status(404).json({ message: "Paquete hotelero no encontrado" });
    }

    res.status(200).json({ message: "Paquete hotelero actualizado correctamente", paquete: paqueteActualizado });
}));

//habilitar o inhabliitar un tour
paqueteRoute.patch("/cambiar-status-paquete/:id", AsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
  
      if (!["activo", "inactivo"].includes(estado)) {
        return res.status(400).json({ message: "Estado no válido. Use 'activo' o 'inactivo'." });
      }
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de paquete no válido." });
      }
  
      const paquete = await Paquetes.findByIdAndUpdate(id, { estado }, { new: true });
  
      if (!paquete) {
        return res.status(404).json({ message: "Paquete Hotelero no encontrado." });
      }
  
      res.status(200).json({
        message: estado === "activo" ? "Paquete habilitado correctamente" : "Paquete inhabilitado correctamente",
        paquete,
      });
  
    } catch (error) {
      console.error("Error al cambiar el estado del paquete:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }));
  
  


module.exports = paqueteRoute;
