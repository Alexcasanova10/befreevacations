const Reserva = require('../models/Ventas/reservas'); 

const validarReservaExistente = async (req, res, next) => {
    const { id } = req.params;

    try {
        const reserva = await Reserva.findById(id);
        if (!reserva) {
            return res.status(404).json({ message: "La reserva no existe." });
        }

        // Verificar que tenga items en la reserva y datos necesarios
        if (!reserva.reservaItems || reserva.reservaItems.length === 0) {
            return res.status(400).json({ message: "La reserva no tiene elementos válidos." });
        }

        next(); 
        console.log('Validación correcta')
    } catch (error) {
        res.status(500).json({ message: "Error al verificar la reserva." + error });
    }
};

module.exports = validarReservaExistente;
