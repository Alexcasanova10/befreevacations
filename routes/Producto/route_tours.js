const express = require("express");
const toursRoute = express.Router();
const AsyncHandler = require("express-async-handler");
const Agencia = require("../../models/Productos/agencias.js");
const  Tours = require("../../models/Productos/tour.js");
const  Destino = require("../../models/Productos/destinos.js");
const  contactoTours = require("../../models/Contacto/formulario_contacto_tours.js");

const dns = require("dns");
const nodemailer = require('nodemailer');

const { validarEmail, validarDominioEmail, validarTelefono } = require("../../utils/validaciones.js");
const {sanitizeInput, hasMaliciousContent, limiter } = require("../../utils/security.js");

const mongoose = require("mongoose");


       
        // Obtener el nombre del destino
        // const destino_name = await Destino.findById(tour.destino).select("tipo_destino");
        // const destino_name.
        // if (!destino_name) {
        //     return res.status(404).json({ message: "Nombr de destino no encontrado" });
        // }

//obtener todos los tours, con filtro de ordenamiento de precio (mayor-menor), por cateogira, por dia de la semana disponible y que sólo muestre los tours activos
/* GET http://localhost:9000/api/tours/obtener-tours?precio=asc
GET http://localhost:9000/api/tours/obtener-tours?precio=desc
GET http://localhost:9000/api/tours/obtener-tours?categoria=Aventura
GET http://localhost:9000/api/tours/obtener-tours?dia=Viernes&dia=Sábado&dia=Domingo
*/


//Obtener tours por destino **Pendiente
toursRoute.get("/obtener-tours", AsyncHandler(async (req, res) => {
    try {
        let query = { estado: "activo" }; // Solo mostrar los tours activos

        // FILTRO POR CATEGORÍA
        if (req.query.categoria) {
            query.categoria = req.query.categoria; // Debe coincidir con el enum
        }

        // FILTRO POR DÍA DISPONIBLE
        if (req.query.dia) {
            query.dias_semana_disponibles = req.query.dia; // Filtra por un día específico
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

        // FILTRO POR DURACIÓN (Half Day o Full Day)
        if (req.query.duracion) {
            if (req.query.duracion === "half") {
                query.duracion_horas = { $lte: 6 }; // Tours de medio día (≤ 6 horas)
            } else if (req.query.duracion === "full") {
                query.duracion_horas = { $gte: 7 }; // Tours de día completo (≥ 7 horas)
            }
        }

        // ORDENAMIENTO POR PRECIO
        let sort = {};
        if (req.query.precio) {
            if (req.query.precio === "asc") {
                sort.precio_por_pax_sin_iva = 1; // Precio de menor a mayor
            } else if (req.query.precio === "desc") {
                sort.precio_por_pax_sin_iva = -1; // Precio de mayor a menor
            }
        }



          // EJECUTAR CONSULTA CON POPULATE**new
          const tours = await Tours.find(query)
          .sort(sort)
          .populate("destino", "tipo_destino"); // Solo traemos el tipo_destino

        // // EJECUTAR CONSULTA
        // const tours = await Tours.find(query).sort(sort);


        res.json(tours);
    } catch (error) {
        res.status(500).json({ message: "No se pudo obtener los tours", error: error.message });
    }
}));

//obtener información single tour
toursRoute.get("/obtener-tours/:id",AsyncHandler(async(req,res)=>{
    try {
        // const tour = await Tours.findById(req.params.id);
        const tour = await Tours.findById(req.params.id).populate("destino", "tipo_destino");
        if (!tour) {
            return res.status(404).json({ message: "Tour no encontrado" });
        }
        res.json({tour});
    } catch (error) {
        res.status(500).json({ message: "No se pudo obtener el tour"});
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
toursRoute.post("/obtener-tours/:id/enviar-correo", AsyncHandler(async (req, res) => {
    const id_tour = req.params.id;
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
    const tour = await Tours.findById(id_tour).select("nombre_tour");
    if (!tour) {
        return res.status(404).json({ message: "Tour no encontrado" });
    }

    // Extraer el dominio del correo
    const dominio = correo.split("@")[1];

    dns.resolveMx(dominio, async (err, direcciones) => {
        if (err || !direcciones || direcciones.length === 0 ) {
            return res.status(400).json({ message: "El dominio del correo no es válido" });
        }

        try {
            // Crear y guardar el contacto en la base de datos
            const nuevoCorreo = new contactoTours({
                id_tour,
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
                subject: `Nuevo mensaje de contacto sobre el tour: ${tour.nombre_tour}`,
                text: `Has recibido un nuevo mensaje de contacto.\n\n
                    Nombre: ${nombre} ${apellido}\n
                    Teléfono: ${telefono}\n
                    Correo: ${correo}\n
                    Tour: ${tour.nombre_tour}\n
                    Motivo de la duda: ${motivo_duda}\n
                    Mensaje: ${mensaje}`,
                html: `<p><strong>Has recibido un nuevo mensaje de contacto.</strong></p>
                        <p><strong>Nombre:</strong> ${nombre} ${apellido}</p>
                        <p><strong>Teléfono:</strong> ${telefono}</p>
                        <p><strong>Correo:</strong> ${correo}</p>
                        <p><strong>Tour:</strong> ${tour.nombre_tour}</p>
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


//ruta que crea el tours
toursRoute.post("/crear-tours", AsyncHandler(async (req, res) => {
    const { nombre_tour,descripcion_general,descripcion_específica,caracteristicas_incluidas,recomendaciones,destino, hora_inicio, duracion_horas, limite_pax,
            transportacion_incluida, precio_por_pax_sin_iva, edad_minima, ninios_permitidos, categoria,
            embarazadas_permitidas, tercera_edad_permitida, condicion_fisica_requerida, 
            idioma_tour, dias_semana_disponibles, caracteristicas, agencia, fotos, video,ubicacion } = req.body;

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

    // Crear nuevo tour
    const nuevoTour = new Tours({
        nombre_tour,
        descripcion_general,
        descripcion_específica,
        caracteristicas_incluidas,
        recomendaciones,
        destino: destinoEncontrado._id,
        hora_inicio,
        duracion_horas,
        limite_pax,
        transportacion_incluida,
        precio_por_pax_sin_iva,
        // precio_por_pax_con_iva, 
        edad_minima,
        categoria,
        ninios_permitidos,
        embarazadas_permitidas,
        tercera_edad_permitida,
        condicion_fisica_requerida,
        idioma_tour,
        dias_semana_disponibles,
        caracteristicas,
        agencia: agenciaEncontrada._id,
        fotos,
        video,
        ubicacion
     });

    // Guardar en la base de datos
    await nuevoTour.save();

    const url_updated = `http://localhost:9000/api/tours/obtener-tours/${nuevoTour._id}`;

    nuevoTour.url_tour = url_updated;
    //actualiza url_tour 
    await nuevoTour.save();
    

    res.status(201).json({ message: "Tour creado exitosamente", tour: nuevoTour });
}));

// Actualizar información del tour
toursRoute.patch("/actualizar-tour/:id", AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const datosActualizados = req.body;

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

    // Recalcular precio con IVA si se actualiza el precio sin IVA
    if (datosActualizados.precio_por_pax_sin_iva) {
        // datosActualizados.precio_por_pax_con_iva = datosActualizados.precio_por_pax_sin_iva * 1.16;
        datosActualizados.precio_por_pax_con_iva;
    }

    const tourActualizado = await Tours.findByIdAndUpdate(id, datosActualizados, { new: true });

    if (!tourActualizado) {
        return res.status(404).json({ message: "Tour no encontrado" });
    }

    res.status(200).json({ message: "Tour actualizado correctamente", tour: tourActualizado });
}));

//habilitar o inhabliitar un tour
toursRoute.patch("/cambiar-status-tour/:id", AsyncHandler(async (req, res) => {
      try {
        const { id } = req.params;
        const { estado } = req.body;
  
        // Verificar que el estado sea válido
        if (!["activo", "inactivo"].includes(estado)) {
          return res.status(400).json({ message: "Estado no válido. Use 'activo' o 'inactivo'." });
        }
  
        // Verificar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: "ID de tour no válido." });
        }
  
        // Buscar el tour por ID
        const tour = await Tours.findById(id);
        if (!tour) {
          return res.status(404).json({ message: "Tour no encontrado." });
        }
  
        // Actualizar el estado del tour
        tour.estado = estado;
        await tour.save();
  
        // Responder según el nuevo estado
        res.status(200).json({
          message: estado === "activo" ? "Tour habilitado correctamente" : "Tour inhabilitado correctamente",
          tour,
        });
      } catch (error) {
        console.error("Error al cambiar el estado del tour:", error);
        res.status(500).json({ message: "Error interno del servidor." });
      }
    })
  );
  




module.exports = toursRoute;