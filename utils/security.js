const sanitizeHtml = require("sanitize-html");
const rateLimit = require("express-rate-limit");

/**
 * Sanitiza texto para evitar inyecciones HTML y XSS
 */
const sanitizeInput = (input) => {
    return sanitizeHtml(input, {
        allowedTags: [], 
        allowedAttributes: {},
    });
};

/**
 * Valida si un string tiene caracteres peligrosos (ejemplo: código JavaScript)
 */
const hasMaliciousContent = (input) => {
    const blacklist = /<script|onerror|onload|eval|document\.cookie|localStorage|sessionStorage|window\.location/gi;
    return blacklist.test(input);
};


/**
 * Middleware para evitar ataques por fuerza bruta
 */
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 5, // 5 intentos por IP
    message: "Demasiadas solicitudes, intenta más tarde.",
});

module.exports = {
    sanitizeInput,
    hasMaliciousContent,
    limiter,
};
