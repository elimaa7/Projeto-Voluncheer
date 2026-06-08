const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB, generateId } = require('../db/database');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'voluncheer_secret_2025';

// POST /ongs/cadastro
router.post('/cadastro', async (req, res) => {
  const { email, senha, ds_ong, ds_cnpj, tel_ong, end_ong, site_ong, comp_ong } = req.body;

  if (!email || !senha || !ds_ong || !ds_cnpj) {
    return res.status(400).json({ erro: 'E-mail, senha, nome da ONG e CNPJ são obrigatórios.' });
  }
  const cnpjLimpo = ds_cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) {
    return res.status(400).json({ erro: 'CNPJ inválido. Deve ter 14 dígitos.' });
  }

  const db = readDB();
  if (db.usuario.find(u => u.ds_email === email)) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }
  if (db.ong.find(o => o.ds_cnpj === cnpjLimpo)) {
    return res.status(409).json({ erro: 'CNPJ já cadastrado.' });
  }

  const id_usuario = generateId();
  db.usuario.push({
    id_usuario,
    ds_email: email,
    ds_senha_hash: await bcrypt.hash(senha, 10),
    tp_usuario: 'ong',
    st_usuario: 'A',
    dt_cadastro: new Date().toISOString()
  });

  const id_ong = generateId();
  const novaOng = {
    id_ong, id_usuario,
    ds_ong, ds_cnpj: cnpjLimpo,
    tel_ong: tel_ong || null,
    end_ong: end_ong || null,
    site_ong: site_ong || null,
    comp_ong: comp_ong || null
  };
  db.ong.push(novaOng);
  writeDB(db);

  res.status(201).json({ mensagem: 'ONG cadastrada com sucesso!', ong: novaOng });
});

// POST /ongs/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

  const db = readDB();
  const usuario = db.usuario.find(u => u.ds_email === email && u.tp_usuario === 'ong');
  if (!usuario || !await bcrypt.compare(senha, usuario.ds_senha_hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  const ong = db.ong.find(o => o.id_usuario === usuario.id_usuario);
  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, id_ong: ong.id_ong, tp_usuario: 'ong' },
    SECRET, { expiresIn: '24h' }
  );
  res.json({ mensagem: 'Login realizado com sucesso!', token });
});

// GET /ongs — público, com filtros
router.get('/', (req, res) => {
  const db = readDB();
  let ongs = db.ong;
  if (req.query.comp_ong) {
    ongs = ongs.filter(o => o.comp_ong?.toLowerCase().includes(req.query.comp_ong.toLowerCase()));
  }
  res.json({ total: ongs.length, ongs });
});

// GET /ongs/:id — público
router.get('/:id', (req, res) => {
  const db = readDB();
  const ong = db.ong.find(o => o.id_ong === req.params.id);
  if (!ong) return res.status(404).json({ erro: 'ONG não encontrada.' });
  res.json(ong);
});

// PUT /ongs/:id [AUTH]
router.put('/:id', autenticar, (req, res) => {
  if (req.usuario.tp_usuario !== 'ong' || req.usuario.id_ong !== req.params.id) {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }
  const db = readDB();
  const idx = db.ong.findIndex(o => o.id_ong === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'ONG não encontrada.' });

  ['ds_ong','tel_ong','end_ong','site_ong','comp_ong'].forEach(c => {
    if (req.body[c] !== undefined) db.ong[idx][c] = req.body[c];
  });
  writeDB(db);
  res.json({ mensagem: 'ONG atualizada com sucesso!', ong: db.ong[idx] });
});

// DELETE /ongs/:id [AUTH]
router.delete('/:id', autenticar, (req, res) => {
  if (req.usuario.tp_usuario !== 'ong' || req.usuario.id_ong !== req.params.id) {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }
  const db = readDB();
  const ong = db.ong.find(o => o.id_ong === req.params.id);
  if (!ong) return res.status(404).json({ erro: 'ONG não encontrada.' });
  db.ong = db.ong.filter(o => o.id_ong !== req.params.id);
  db.usuario = db.usuario.filter(u => u.id_usuario !== ong.id_usuario);
  writeDB(db);
  res.json({ mensagem: 'ONG removida com sucesso.' });
});

module.exports = router;
