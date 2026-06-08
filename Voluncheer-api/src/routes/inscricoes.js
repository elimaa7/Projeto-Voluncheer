const express = require('express');
const { readDB, writeDB, generateId } = require('../db/database');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

// POST /inscricoes — voluntário se inscreve em evento [AUTH]
router.post('/', autenticar, (req, res) => {
  if (req.usuario.tp_usuario !== 'voluntario') {
    return res.status(403).json({ erro: 'Apenas voluntários podem se inscrever em eventos.' });
  }
  const { id_evento } = req.body;
  if (!id_evento) return res.status(400).json({ erro: 'id_evento é obrigatório.' });

  const db = readDB();

  // Verifica se evento existe
  const evento = db.evento.find(e => e.id_evento === id_evento);
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });

  // Verifica inscrição duplicada
  const jaInscrito = db.inscricao.find(
    i => i.id_voluntario === req.usuario.id_voluntario && i.id_evento === id_evento
  );
  if (jaInscrito) return res.status(409).json({ erro: 'Você já está inscrito neste evento.' });

  const novaInscricao = {
    id_inscricao: generateId(),
    id_voluntario: req.usuario.id_voluntario,
    id_evento,
    dt_inscricao: new Date().toISOString(),
    status_inscricao: 'pendente'
  };
  db.inscricao.push(novaInscricao);
  writeDB(db);
  res.status(201).json({ mensagem: 'Inscrição realizada com sucesso!', inscricao: novaInscricao });
});

// GET /inscricoes/minha — listar inscrições do voluntário logado [AUTH]
router.get('/minha', autenticar, (req, res) => {
  if (req.usuario.tp_usuario !== 'voluntario') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }
  const db = readDB();
  const inscricoes = db.inscricao
    .filter(i => i.id_voluntario === req.usuario.id_voluntario)
    .map(i => {
      const evento = db.evento.find(e => e.id_evento === i.id_evento);
      return { ...i, evento };
    });
  res.json({ total: inscricoes.length, inscricoes });
});

// DELETE /inscricoes/:id — cancelar inscrição [AUTH]
router.delete('/:id', autenticar, (req, res) => {
  const db = readDB();
  const inscricao = db.inscricao.find(i => i.id_inscricao === req.params.id);
  if (!inscricao) return res.status(404).json({ erro: 'Inscrição não encontrada.' });
  if (inscricao.id_voluntario !== req.usuario.id_voluntario) {
    return res.status(403).json({ erro: 'Você só pode cancelar suas próprias inscrições.' });
  }
  db.inscricao = db.inscricao.filter(i => i.id_inscricao !== req.params.id);
  writeDB(db);
  res.json({ mensagem: 'Inscrição cancelada com sucesso.' });
});

module.exports = router;
