const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {

    const token = req.header('x-auth-token');

    if (!token) {
        console.log("⚠️ Bloqueado: Tentativa de acesso sem token.");
        return res.status(401).json({ erro: 'Acesso negado. Por favor, faça login.' });
    }

    try {

        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        

        req.usuario = decodificado;
        

        next(); 
    } catch (ex) {

        console.log("❌ Erro: Token inválido ou expirado.");
        res.status(400).json({ erro: 'Sua sessão expirou. Faça login novamente.' });
    }
};