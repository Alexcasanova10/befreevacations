 {
    "reservaItems": [
            {
                "nombre_hotel": "Hotel Paraíso Azul",
                "imagen_producto": "https://www.ejemplo.com/hotel1.jpg",
                "nombre_pax_principal": "Zambo",
                "apellido_pax_principal": "Casanova",
                "nombre_acompaniantes": [
                    {
                        "nombre": "Zamba",
                        "apellido": "Perrina"
                    }
                ],
                "fecha_inicio": "2025-02-10T10:00:00.000Z",
                "fecha_fin": "2025-02-22T10:00:00.000Z",
                "habitacion": {
                    "nombre_habitacion": "Ocean View Suite",
                    "personas_habitacion": 2,
                    "precio_noche_con_iva": 2088
                },
                "paquete_Hotelero_id": "67b4cd5bddf7d0d9d66c37fc",
                "transfer": {
                    "transportacion_incluida": true,
                    "tipo_transfer": "one way"
                }            
            },
            {      
                "nombre_tour":"Royal Garrafon",
                "imagen_producto": "https://cdn1.dtraveller.net/content/garrafonpark/royal-garrafon-park-basic.jpg",
                "nombre_pax_principal": "Pepe",
                "apellido_pax_principal": "Perez",
                "nombre_Acompaniantes": {
                    "nombre": "anon",
                    "apellido": "smith"
                },
                "cantidad_pax": 2,
                
                "costo_pax_sin_iva": 50.00,
                
                "costo_total": 100.00,
    
                "fecha_actvidad": "2025-02-10T10:00:00.000Z",
                "tour_id": "67b969576f9529838720d20e",
    
                "transfer": {
                    "transporacion_incluida": true,
                    "pick_up_point": "Hotel Royalton Riviera",
                    "dropp_off_point": ""
                }
            }
    ],
    "email_pax": "casanovaalex61@outlook.com",
    "numero_telefono": "9981555164",
    "impuesto_precio": 16.00,
    "costoFinal": 116.00
}



const detallesReserva = reservaItems.map((item) => {
    return `
        
        ${item.nombre_tour ? `<p><strong>Tour:</strong> ${item.nombre_tour}</p>` : ""}
        <img src="${item.imagen_producto}" alt="Imagen del producto" width="200">
        <p><strong>Nombre Pasajero Principal:</strong> ${item.nombre_pax_principal} </p>
        <p><strong>Apellido Pasajero Principal:</strong>
            ${item.apellido_pax_principal}
        </p>
        
        ${item.nombre_Acompaniantes ? 
            `
            <p><strong>Acompañantes: </strong></p>
            <ul>
                <li>
                    ${item.nombre_Acompaniantes.nombre} " " ${item.nombre_Acompaniantes.apellido}
                </li>
            </ul>`
            :
            ""    
        }              
        ${item.cantidad_pax
            ?
            `<p><strong>Cantidad de pasajeros:${item.cantidad_pax}</strong> </p>`
            :" "
        }
        ${item.precio_por_pax_con_iva
            ?
            `<p><strong>Precio por pax:</strong> $${item.precio_por_pax_con_iva}</p>`
            :" "
        }

        ${item.fecha_actvidad ? `<p><strong>Fecha de actividad:</strong> ${new Date(item.fecha_actvidad).toLocaleDateString()}</p>` : ""}

        ${item.transfer_tour && item.transfer_tour.transporacion_incluida 
            ? 
            `
                <p><strong>Transporte incluido:</strong> Sí</p>
                <p><strong>Pick up point:</strong> ${item.transfer_tour.pick_up_point}</p>
                <p><strong>Dropp off point:</strong>${item.transfer_tour.dropp_off_point}</p>
            ` 
            : ""
        }
        
        ${item.nombre_hotel ? `<p><strong>Hotel:</strong> ${item.nombre_hotel}</p>` : ""}
        ${item.habitacion ? 
            `
            <p><strong>Habitación:</strong> 
                ${item.habitacion.nombre_habitacion}
                ${item.habitacion.personas_habitacion}
                $${item.habitacion.precio_noche_con_iva}
            
            </p>
            ` 
            : " "
        }
        ${item.fecha_inicio && item.fecha_fin ? `<p><strong>Check In:</strong> ${new Date(item.fecha_inicio).toLocaleDateString()} <p><strong>Check Out:</strong> ${new Date(item.fecha_fin).toLocaleDateString()}</p>` : ""}

        ${item.transfer_hotel && item.transfer_hotel.transporacion_incluida 
            ? 
            `
                <p><strong>Transporte incluido:</strong> Sí</p>
                <p><strong>Tipo de transportación:</strong> ${item.transfer_hotel.tipo_transfer}</p>
                
                ${item.transfer_hotel_transfer ?
                    `<p><strong>Servicio de One Way:${item.transfer_hotel.one_way_transfer}</strong></p>` 
                    :
                    " "
                }
                <p><strong>Clase :</strong>${item.transfer_hotel.clase_transfer}</p>
                ${item.transfer_hotel.vuelo_llegada ?
                    `<p><strong>Servicio de One Way:${item.transfer_hotel.vuelo_llegada}</strong></p>` 
                    :
                    " "
                }

                ${item.transfer_hotel.vuelo_salida ?
                    `<p><strong>Servicio de One Way:${item.transfer_hotel.vuelo_salida}</strong></p>` 
                    :
                    " "
                }
            ` 
            : " "
        }

        
        <hr>
    `;
}).join("");     
