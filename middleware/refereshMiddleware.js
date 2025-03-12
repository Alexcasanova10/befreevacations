 //middleware que renuva el acces token automaticamente 
const jwt = require("jsonwebtoken");

const refreshMiddleware = (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "No hay sesión activa" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Generar un nuevo Access Token
        const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        return res.status(403).json({ message: "Refresh token inválido o expirado" });
    }
};

// module.exports = refreshMiddleware;

// const jwt = require("jsonwebtoken");

// const refreshMiddleware = (req, res, next) => {
//     const refreshToken = req.cookies.refreshToken;

//     if (!refreshToken) {
//         return res.status(401).json({ message: "No hay sesión activa" });
//     }

//     try {
//         const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

//         // Generar un nuevo Access Token
//         const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
//             expiresIn: "1h",
//         });

//         // Devolver el token en los headers y en el JSON
//         res.header("Authorization", `Bearer ${newAccessToken}`);
//         res.json({ accessToken: newAccessToken });
//     } catch (error) {
//         return res.status(403).json({ message: "Refresh token inválido o expirado" });
//     }
// };

// module.exports = refreshMiddleware;


// const jwt = require("jsonwebtoken");

// const refreshMiddleware = (req, res, next) => {
//     const refreshToken = req.cookies.refreshToken;

//     if (!refreshToken) {
//         return res.status(401).json({ message: "No hay sesión activa" });
//     }

//     try {
//         const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

//         // Nuevo Access Token
//         const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "10s" });

//         res.json({ accessToken: newAccessToken });
//     } catch (error) {
//         return res.status(403).json({ message: "Refresh token inválido o expirado" });
//     }
// };

module.exports = refreshMiddleware;
