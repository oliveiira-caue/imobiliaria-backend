const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ erro: 'Acesso negado. Faça login para continuar.' });
    }

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado;
        } catch (error) {
        res.status(400).json({ erro: 'Token inválido ou expirado.' });
    }
};