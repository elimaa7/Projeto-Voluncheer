const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB, generateId } = require('../db/database');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'voluncheer_secret_2025';

// POST /voluntarios/cadastro
// Cria usuario (tp_usuario='voluntario') + perfil voluntario
router.post('/cadastro', async (req, res) => {
  const { email, senha, nm_voluntario, tel_voluntario, dt_nascimento } = req.body;

  if (!email || !senha || !nm_voluntario) {
    return res.status(400).json({ erro: 'E-mail, senha e nome são obrigatórios.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }
  if (senha.length < 6 || !/\d/.test(senha)) {
    return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres e pelo menos 1 número.' });
  }

  const db = readDB();
  if (db.usuario.find(u => u.ds_email === email)) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }

  const id_usuario = generateId();
  const novoUsuario = {
    id_usuario,
    ds_email: email,
    ds_senha_hash: await bcrypt.hash(senha, 10),
    tp_usuario: 'voluntario',
    st_usuario: 'A',
    dt_cadastro: new Date().toISOString()
  };

  const id_voluntario = generateId();
  const novoVoluntario = {
    id_voluntario,
    id_usuario,
    nm_voluntario,
    tel_voluntario: tel_voluntario || null,
    dt_nascimento: dt_nascimento || null
  };

  db.usuario.push(novoUsuario);
  db.voluntario.push(novoVoluntario);
  writeDB(db);

  res.status(201).json({
    mensagem: 'Voluntário cadastrado com sucesso!',
    voluntario: novoVoluntario
  });
});

// POST /voluntarios/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

  const db = readDB();
  const usuario = db.usuario.find(u => u.ds_email === email && u.tp_usuario === 'voluntario');
  if (!usuario) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  if (!await bcrypt.compare(senha, usuario.ds_senha_hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  const voluntario = db.voluntario.find(v => v.id_usuario === usuario.id_usuario);
  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, id_voluntario: voluntario.id_voluntario, tp_usuario: 'voluntario' },
    SECRET, { expiresIn: '24h' }
  );

  res.json({ mensagem: 'Login realizado com sucesso!', token });
});

// GET /voluntarios — listar todos [AUTH]
router.get('/', autenticar, (req, res) => {
  const db = readDB();
  const lista = db.voluntario.map(v => {
    const u = db.usuario.find(u => u.id_usuario === v.id_usuario);
    return { ...v, ds_email: u?.ds_email, st_usuario: u?.st_usuario };
  });
  res.json({ total: lista.length, voluntarios: lista });
});

// GET /voluntarios/:id [AUTH]
router.get('/:id', autenticar, (req, res) => {
  const db = readDB();
  const voluntario = db.voluntario.find(v => v.id_voluntario === req.params.id);
  if (!voluntario) return res.status(404).json({ erro: 'Voluntário não encontrado.' });
  const usuario = db.usuario.find(u => u.id_usuario === voluntario.id_usuario);
  res.json({ ...voluntario, ds_email: usuario?.ds_email });
});

// PUT /voluntarios/:id [AUTH]
router.put('/:id', autenticar, async (req, res) => {
  const db = readDB();
  const idx = db.voluntario.findIndex(v => v.id_voluntario === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Voluntário não encontrado.' });
  if (req.usuario.id_voluntario !== req.params.id) {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }

  const { nm_voluntario, tel_voluntario, dt_nascimento, senha } = req.body;
  if (nm_voluntario) db.voluntario[idx].nm_voluntario = nm_voluntario;
  if (tel_voluntario) db.voluntario[idx].tel_voluntario = tel_voluntario;
  if (dt_nascimento) db.voluntario[idx].dt_nascimento = dt_nascimento;

  if (senha) {
    if (senha.length < 6 || !/\d/.test(senha)) {
      return res.status(400).json({ erro: 'Senha inválida.' });
    }
    const uidx = db.usuario.findIndex(u => u.id_usuario === db.voluntario[idx].id_usuario);
    db.usuario[uidx].ds_senha_hash = await bcrypt.hash(senha, 10);
  }

  writeDB(db);
  res.json({ mensagem: 'Voluntário atualizado com sucesso!', voluntario: db.voluntario[idx] });
});

// DELETE /voluntarios/:id [AUTH]
router.delete('/:id', autenticar, (req, res) => {
  if (req.usuario.id_voluntario !== req.params.id) {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }
  const db = readDB();
  const voluntario = db.voluntario.find(v => v.id_voluntario === req.params.id);
  if (!voluntario) return res.status(404).json({ erro: 'Voluntário não encontrado.' });

  db.voluntario = db.voluntario.filter(v => v.id_voluntario !== req.params.id);
  db.usuario = db.usuario.filter(u => u.id_usuario !== voluntario.id_usuario);
  writeDB(db);
  res.json({ mensagem: 'Voluntário removido com sucesso.' });
});

module.exports = router;
