const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'voluncheer_secret_2025';

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login primeiro.' });
  }

  jwt.verify(token, SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido ou expirado.' });
    }
    req.usuario = usuario;
    next();
  });
}

module.exports = { autenticar };
