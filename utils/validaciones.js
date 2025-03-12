const dns = require("dns").promises;
const validator = require("validator");
/**
 * Validar formato de email con regex
 */
const validarEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

/**
 * Validar si el dominio del email existe (consulta DNS)
 */
const validarDominioEmail = async (email) => {
    const dominio = email.split("@")[1];
    try {
        const registrosMX = await dns.resolveMx(dominio);
        return registrosMX.length > 0;
    } catch (error) {
        return false;
    }
};

/**
 * Valida un email correctamente
 */
const validarEmailValidator = (email) => {
    return validator.isEmail(email);
};


/**
 * Validar que el teléfono tenga exactamente 10 dígitos numéricos
 */
const validarTelefono = (telefono) => {
    return /^[0-9]{10}$/.test(telefono);
};

module.exports = { validarEmail, validarDominioEmail, validarTelefono, validarEmailValidator};
