const express = require('express');
const { readDB, writeDB, generateId } = require('../db/database');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

// POST /eventos — apenas ONG [AUTH]
router.post('/', autenticar, (req, res) => {
  if (req.usuario.tp_usuario !== 'ong') {
    return res.status(403).json({ erro: 'Apenas ONGs podem criar eventos.' });
  }
  const { end_evento, dt_evento, ds_evento, qt_vagas } = req.body;
  if (!dt_evento || !ds_evento) {
    return res.status(400).json({ erro: 'Data e descrição do evento são obrigatórios.' });
  }
  const db = readDB();
  const novoEvento = {
    id_evento: generateId(),
    id_ong: req.usuario.id_ong,
    end_evento: end_evento || null,
    dt_evento,
    ds_evento,
    qt_vagas: qt_vagas || null
  };
  db.evento.push(novoEvento);
  writeDB(db);
  res.status(201).json({ mensagem: 'Evento criado com sucesso!', evento: novoEvento });
});

// GET /eventos — público
router.get('/', (req, res) => {
  const db = readDB();
  res.json({ total: db.evento.length, eventos: db.evento });
});

// GET /eventos/:id — público
router.get('/:id', (req, res) => {
  const db = readDB();
  const evento = db.evento.find(e => e.id_evento === req.params.id);
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
  res.json(evento);
});

// DELETE /eventos/:id [AUTH - ONG dona]
router.delete('/:id', autenticar, (req, res) => {
  if (req.usuario.tp_usuario !== 'ong') {
    return res.status(403).json({ erro: 'Apenas ONGs podem remover eventos.' });
  }
  const db = readDB();
  const evento = db.evento.find(e => e.id_evento === req.params.id);
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
  if (evento.id_ong !== req.usuario.id_ong) {
    return res.status(403).json({ erro: 'Você só pode remover seus próprios eventos.' });
  }
  db.evento = db.evento.filter(e => e.id_evento !== req.params.id);
  writeDB(db);
  res.json({ mensagem: 'Evento removido com sucesso.' });
});

module.exports = router;
