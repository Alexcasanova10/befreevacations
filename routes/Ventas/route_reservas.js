

const express = require("express");
const reservasRoute = express.Router();
const AsyncHandler = require("express-async-handler");

const Agencia = require("../../models/Productos/agencias.js");
const Tour = require("../../models/Productos/tour.js");
const Paquete_Hotelero = require("../../models/Productos/paquetes_hoteleros.js");
const Reserva = require("../../models/Ventas/reservas.js");

const Cliente = require("../../models/Usuarios/clientes.js");
const Agente = require("../../models/Usuarios/agentes_cc.js")

const Entrada = require("../../models/Ventas/entradas.js")

const Destino = require("../../models/Productos/destinos.js");

const dns = require("dns");
const nodemailer = require('nodemailer');

const { validarEmail, validarDominioEmail, validarTelefono } = require("../../utils/validaciones.js");
const {sanitizeInput, hasMaliciousContent, limiter } = require("../../utils/security.js");

const mongoose = require("mongoose");

const protect = require("../../middleware/authCliente.js")
const protectAgente = require("../../middleware/authAgente.js")
const validarReservaExistente = require("../../middleware/validarReservaExistente.js")

const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT }=require("google-auth-library")
const creds = require("../../google-credentials.json"); // Archivo de credenciales
const { error } = require("console");
require('dotenv').config();




/* POST Crea reserva. 
Flujo  de creación de reserva
En página de producto, pax ingresa datros de la reserva (fechas, datos de trasnfer, nombre pax's,datos de contacto,id de producto, lso datos intrinsecos del tipo de prodcuto ) 
Interno, obejto reserva se genera como pendiente en color amarillo con estatus pendiente, a la vez se llena un Excel en la nube (Drive) con la información de la reserva y también se llena en la BD
Interno, incrementa cantidad de ventas en dicho producto
Interno, se seria la reserva desde el 0000N
Se manda el correo al pax con la información de la reserva y con el enlace de pago (en caso de no pagar en el momento). 
Dirige a cart con dos opciones:checktou o link de pago por correo (ese link es el checkout) //API PUT
Si el usuario sale de eesa ventna, el itme de reserva aun queda en su cart y tendra que eliminarlo manualmente para quitarlo del cart.

Consideraciones
Si la sesión está prendida, detecte el tipo de user (cliente o agente_cc)
Si no hay sesión,el cliente es guest, user_Guest: type: Boolean queda en true,
Si no paga al momento, en el cart está la opción de recibir link de pago en correo)
Incluir midlleware que valide el proceso de compra, si no se tiene proceso iniciado, redirigir a inicio de sesión, maybe validar en front
En esta api, la reserva está por default en amarillo como pendiente
*/// Crear nuevo correo

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

const SPREADSHEET_ID = "1jTk1LYFKIIFMKS038rhV5gpMAND7eV-kWyv-D8_RlhU"; // Reemplázalo con el ID de tu hoja de cálculo en Google Drive

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

 
async function agregarReservaAGoogleSheets(reserva) {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0]; // Usa la primera hoja de cálculo
        
        // Cargar los encabezados existentes
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;

        // Si no hay encabezados, establecerlos
        if (headers.length === 0) {
            await sheet.setHeaderRow([
                "ID_Reserva", "Email", "Usuario", "Canal_Venta", "Reserva_Items", 
                "Estado_Reserva", "Costo_Final","Numero_Telefono", 
                "Tipo_Reserva"
            ]);
            console.log("Encabezados agregados a Google Sheets.");
        }

        // Construir la información de los reservaItems en un solo string
        const reservaItemsString = reserva.reservaItems.map(item => 
            `Pax: ${item.nombre_pax_principal} ${item.apellido_pax_principal}`
        ).join(" | ");

        // Agregar la reserva como una nueva fila en la hoja
        await sheet.addRow({
            ID_Reserva: reserva.id_reserva,
            Email: reserva.email_pax,
            Usuario: reserva.user ? reserva.user : "Guest",
            Canal_Venta: reserva.canal_venta,
            Reserva_Items: reservaItemsString,
            Estado_Reserva: reserva.estado_reserva,
            Costo_Final: reserva.costoFinal,
            Numero_Telefono: reserva.numero_telefono,
            Tipo_Reserva: reserva.tipo_reserva,
         });

        console.log("Reserva agregada a Google Sheets con éxito.");
    } catch (error) {
        console.error("Error al agregar reserva a Google Sheets:", error);
    }
}

async function actualizarEstadoReservaEnGoogleSheets(reserva) {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0]; // Primera hoja

        // Cargar encabezados para asegurarnos de que existen
        await sheet.loadHeaderRow();
        console.log("Encabezados en Google Sheets:", sheet.headerValues);

        // Cargar todas las filas
        const rows = await sheet.getRows();

        // 🔥 DEBUG: Mostrar valores en _rawData
        rows.forEach(row => {
            console.log(`RawData en Sheets:`, row._rawData);
        });

        // Buscar la fila con el ID de reserva accediendo directamente a _rawData
        const indexID = sheet.headerValues.indexOf("ID_Reserva"); // Obtener el índice correcto

        if (indexID === -1) {
            console.error("❌ No se encontró la columna ID_Reserva en los encabezados.");
            return;
        }

        const filaReserva = rows.find(row => 
            String(row._rawData[indexID] || "").trim() === String(reserva.id_reserva).trim()
        );

        if (filaReserva) {
            // Actualizar el estado de la reserva
            const indexEstado = sheet.headerValues.indexOf("Estado_Reserva"); // Buscar el índice de la columna Estado_Reserva

            if (indexEstado !== -1) {
                filaReserva._rawData[indexEstado] = reserva.estado_reserva; // Actualizar el valor en _rawData
                await filaReserva.save(); // Guardar los cambios
                console.log(`✅ Estado de reserva ${reserva.id_reserva} actualizado a ${reserva.estado_reserva} en Google Sheets.`);
            } else {
                console.log("❌ No se encontró la columna Estado_Reserva.");
            }
        } else {
            console.log(`❌ No se encontró la reserva ${reserva.id_reserva} en Google Sheets.`);
        }

    } catch (error) {
        console.error("❌ Error al actualizar reserva en Google Sheets:", error);
    }
}




reservasRoute.post("/generar",AsyncHandler(async (req, res) => {
        let { reservaItems, email_pax, numero_telefono, impuesto_precio, costoFinal } = req.body;

        // Sanitizar entradas
        email_pax = sanitizeInput(email_pax);
        numero_telefono = sanitizeInput(numero_telefono);

        // Prevención contenido malicioso
        if (hasMaliciousContent(email_pax) || hasMaliciousContent(numero_telefono) || hasMaliciousContent(reservaItems)) {
            return res.status(400).json({ message: "Entrada inválida." });
        }

        // Validar correo electrónico
        if (!email_pax || typeof email_pax !== 'string' || !validarEmail(email_pax)) {
            return res.status(400).json({ message: "Correo electrónico inválido" });
        }

        // Validar teléfono
        if (!validarTelefono(numero_telefono)) {
            return res.status(400).json({ message: "Teléfono no válido" });
        }

        if (!reservaItems || reservaItems.length === 0) {
            return res.status(400).json({ message: "No se encontraron items en la reserva" });
        }

        // Determinar tipo de usuario
        let user = null;
        let tipo_usuario = "guest";
        let canal_venta = "guest";
        let user_Guest = true;

        if (req.session.cliente) {
            user = req.session.cliente._id;
            tipo_usuario = "cliente";
            canal_venta = "cliente";
            user_Guest = false;
        } else if (req.session.agente) {
            user = req.session.agente._id;
            tipo_usuario = "agente_cc";
            canal_venta = "call_center";
            user_Guest = false;
        }

        // Generar ID de reserva secuencial
        const lastReserva = await Reserva.findOne().sort({ createdAt: -1 });
        let id_reserva = "0000001";
        if (lastReserva) {
            id_reserva = (parseInt(lastReserva.id_reserva) + 1).toString().padStart(7, "0");
        }  
        

        // Crear la reserva
        const nuevaReserva = new Reserva({
            user,
            tipo_usuario,
            canal_venta,
            user_Guest,
            reservaItems,
            isPaid: false,
            estado_reserva: "pendiente",
            costoFinal,
            impuesto_precio,
            id_reserva,
            email_pax,
            numero_telefono,
        });

        
        const reservaGuardada = await nuevaReserva.save();

 
        await agregarReservaAGoogleSheets(reservaGuardada);

        
        //Guarda el id de agente en casode que el agente (que inicia sesión) es quién hace la compra a nombre del pax
        if(reservaGuardada.canal_venta ==="call_center"){
            const agente = await Agente.findById(req.session.agente._id);
            const agenteId = agente.id_agente;
            reservaGuardada.idAgente= agenteId;
            await reservaGuardada.save();
        }

        // Generar link de pago
        const link_pago = `https://befreevacationsco.ai/checkout/${reservaGuardada._id}`;
        reservaGuardada.link_pago = link_pago;
        await reservaGuardada.save();

        // Construcción del email con información detallada
        
        const detallesReserva = reservaItems.map((item) => {
            return `
                ${item.nombre_tour ? `<p><strong>Tour:</strong> ${item.nombre_tour}</p>` : ""}
                ${item.nombre_hotel ? `<p><strong>Hotel:</strong> ${item.nombre_hotel}</p>` : ""}
                
                <img src="${item.imagen_producto}" alt="Imagen del producto" width="200">
                  ${item.habitacion 
                    ? `<ul>
                           <li><strong>Habitación:</strong> ${item.habitacion.nombre_habitacion}</li>
                           <li><strong>Personas por habitación:</strong> ${item.habitacion.personas_habitacion}</li>
                           <li><strong>Precio por noche:</strong> $${item.habitacion.precio_noche_con_iva}</li>
                       </ul>`
                    : ""}

                <p><strong>Nombre Pasajero Principal:</strong> ${item.nombre_pax_principal} </p>
                <p><strong>Apellido Pasajero Principal:</strong> ${item.apellido_pax_principal}</p>
        
                ${Array.isArray(item.nombre_Acompaniantes) && item.nombre_Acompaniantes.length > 0 
                    ? `<p><strong>Acompañantes:</strong></p>
                       <ul>
                           ${item.nombre_Acompaniantes.map(acomp => `<li>${acomp.nombre} ${acomp.apellido}</li>`).join("")}
                       </ul>`
                    : item.nombre_Acompaniantes?.nombre 
                        ? `<p><strong>Acompañantes:</strong> ${item.nombre_Acompaniantes.nombre} ${item.nombre_Acompaniantes.apellido}</p>`
                        : ""}
        
                ${item.cantidad_pax ? `<p><strong>Cantidad de pasajeros:</strong> ${item.cantidad_pax}</p>` : ""}
                ${item.precio_por_pax_con_iva ? `<p><strong>Precio por pax:</strong> $${item.precio_por_pax_con_iva}</p>` : ""}
        
                ${item.fecha_actvidad ? `<p><strong>Fecha de actividad:</strong> ${new Date(item.fecha_actvidad).toLocaleDateString()}</p>` : ""}
        
                ${item.transfer_tour && item.transfer_tour.transporacion_incluida 
                    ? `<p><strong>Transporte incluido:</strong> Sí</p>
                       <p><strong>Pick up point:</strong> ${item.transfer_tour.pick_up_point}</p>
                       <p><strong>Drop off point:</strong> ${item.transfer_tour.dropp_off_point}</p>` 
                    : ""}
        
        
                ${item.fecha_inicio && item.fecha_fin 
                    ? `<p><strong>Check In:</strong> ${new Date(item.fecha_inicio).toLocaleDateString()}</p>
                       <p><strong>Check Out:</strong> ${new Date(item.fecha_fin).toLocaleDateString()}</p>` 
                    : ""}
        
                ${item.transfer_hotel && item.transfer_hotel.transportacion_incluida 
                    ? `<p><strong>Transporte incluido:</strong> Sí</p>
                       <p><strong>Tipo de transportación:</strong> ${item.transfer_hotel.tipo_transfer}</p>
                       ${item.transfer_hotel.one_way_transfer 
                           ? `<p><strong>Servicio de One Way:</strong> ${item.transfer_hotel.one_way_transfer}</p>` 
                           : " "}
                       <p><strong>Clase:</strong> ${item.transfer_hotel.clase_transfer}</p>
                       ${item.transfer_hotel.vuelo_llegada 
                           ? `<p><strong>Vuelo de llegada:</strong> ${item.transfer_hotel.vuelo_llegada}</p>` 
                           : ""}
                       ${item.transfer_hotel.vuelo_salida 
                           ? `<p><strong>Vuelo de salida:</strong> ${item.transfer_hotel.vuelo_salida}</p>` 
                           : ""}`
                    : ""}
                
                <hr>
            `;
        }).join("");
        

        // Construcción del email con información detallada
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email_pax,
            subject: "Confirmación de Reserva - Pendiente de Pago | Be Free Vacations",
            html: `
                <p>Estimado/a cliente</p>
                <p>Gracias por reservar con Be Free Vacations.</p>
                <h1>Detalle de reserva</h1>
                <p>ID de Reserva: <strong>${id_reserva}</strong></p>
                <p>Estatus: <strong>PENDIENTE DE PAGO</strong></p>
                <p>
                    <strong>Detalles de reserva: </strong>
                    ${detallesReserva}
                </p>
                <p><strong>Total a pagar:</strong> $${costoFinal}</p>
                <p><strong>Teléfono:</strong> ${numero_telefono}</p>
                <p><strong>Email:</strong> ${email_pax}</p>
                <p>Para completar el pago, haga clic en el siguiente enlace:</p>
                <a href="${link_pago}">${link_pago}</a>
                <p>Saludos,</p>
                <p>Equipo de Reservas</p>
            `
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "Reserva creada con éxito", reserva: reservaGuardada });
        console.log(`Reserva creada con éxito: ${reservaGuardada}`);
    })
);


         
// PUT Actualizar el estado de la reserva si el cliente paga en checkout (independientemente si se paga con paypal,stripe,applepay o cashapp). Esta API se activa cuando se paga....
// La reserva se vuelve confirmada (color verde )en el Excel en Drive se actualiza la información de la reserva. Actualizar información de drive....
// Se manda correo con entradas PDF al pax por email. 

//incrementar el counter de ventas de tour o pack

reservasRoute.put("/:id/pago",validarReservaExistente,AsyncHandler(async (req,res)=>{

    const reserva = await Reserva.findById(req.params.id);
    if (reserva) {
      reserva.isPaid = true;
      reserva.paidAt = Date.now();
      
      reserva.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: Date.now(),

      };
      reserva.estado_reserva = "pagado";
    
    
    //obtener id de tour o id de paquete a cada item de reserva items..

    for (let item of reserva.reservaItems) {
        if (item.tour_id) {
            await Tour.findByIdAndUpdate(item.tour_id, { $inc: { ventas: 1 } });
        }
        if (item.paquete_Hotelero_id) {
            await Paquete_Hotelero.findByIdAndUpdate(item.paquete_Hotelero_id, { $inc: { ventas: 1 } });
        }
    }

    const updatedReservation = await reserva.save();

    // Llamar la función para actualizar el estado en Google Sheets
    await actualizarEstadoReservaEnGoogleSheets(updatedReservation);

    console.log(reserva)

    res.status(200).json({message:"Pago procesado correctamente.",updatedReservation});
    } else {
      res.status(404);
      throw new Error("No se encontró la reserva");
    }
}))


// •	PATCH Cancelar reserva (SOLO si ya se pago pero pax no puede asistir, pero esta opción es solo para usuario tipo agente_cc, en el que el pax llama a Customer Service para cancelar)

//GET Todas las reservas (experimental)

reservasRoute.get("/get-reservas",AsyncHandler(async(req,res)=>{
    try {
        const reservas = await Reserva.find();
        res.json(reservas);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las reservas", error: error.message });
    }

}));

// •	GET Obtiene todas las reservas tours, con filtro de menor a mayor precio, fechas de reserva con filtro de precio) y por agencias. 

// GET Rreservas paquete hoteleros con filtro de menor a mayor precio, fechas de reserva con filtro de precio) y por agencias. 

//GET RESERVA ID SINGLE

// •	GET Reservas por usuario (pone el número de teléfono o correo electrónico o nombre y apellido , sale el cliente al hacer click se obtienen sus reservas), interno para el admin panel


// •	GET (Single) reserva, mediante el ID de reserva. //requiere autentificación CLIENTES 
reservasRoute.get("/mis-reservas-cliente",protect,AsyncHandler(async (req, res) => {
      const reservas = await Reserva.find({ user: req.session.cliente._id }).sort({ _id: -1 });
      if (reservas) {
        res.status(200).json(reservas);
      } else {
        res.status(404);
        throw new Error("No se encontraron reservas");
      }
    })
);
// •	GET (Single) reserva, mediante el ID de reserva. //requiere autentificación AGENTES CC 
reservasRoute.get("/reservas-agente",protectAgente,AsyncHandler(async (req, res) => {
      const reservas = await Reserva.find({ user: req.session.agente._id }).sort({ _id: -1 });
      if (reservas) {
        res.status(200).json(reservas);
      } else {
        res.status(404);
        throw new Error("No se encontraron reservas");
      }
    })
);



module.exports = reservasRoute