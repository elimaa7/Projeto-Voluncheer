import { Router } from 'express'
import eventosRepo from './eventosRepo.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pUsuarios = path.join(__dirname, './usuarios.json')

const eventosRoutes = Router()

// Helper: lê usuários
const lerUsuarios = () => JSON.parse(fs.readFileSync(pUsuarios, 'utf-8') || '[]')

// Helper: valida sessão ONG (recebe { email, senha } no header ou body)
const autenticarONG = (req) => {
    const { ong_email, ong_senha } = req.headers
    if (!ong_email || !ong_senha) return null
    const usuarios = lerUsuarios()
    const user = usuarios.find(u =>
        u.email === ong_email &&
        u.senha === ong_senha &&
        u.tipo === 'ong'
    )
    return user || null
}

// GET /eventos — lista todos os eventos (público)
eventosRoutes.get('/eventos', (req, res) => {
    const eventos = eventosRepo.readAll()
    // Ordena por data mais recente primeiro
    eventos.sort((a, b) => new Date(a.data) - new Date(b.data))
    res.status(200).json(eventos)
})

// GET /eventos/:id — detalhe de um evento (público)
eventosRoutes.get('/eventos/:id', (req, res) => {
    const evento = eventosRepo.readById(Number(req.params.id))
    if (!evento) return res.status(404).json({ message: 'Evento não encontrado.' })
    res.status(200).json(evento)
})

// GET /meus-eventos — eventos da ONG autenticada
eventosRoutes.get('/meus-eventos', (req, res) => {
    const ong = autenticarONG(req)
    if (!ong) return res.status(401).json({ message: 'Autenticação de ONG necessária.' })
    const eventos = eventosRepo.readByOng(ong.id)
    res.status(200).json(eventos)
})

// POST /eventos — criar evento (somente ONG)
eventosRoutes.post('/eventos', (req, res) => {
    const ong = autenticarONG(req)
    if (!ong) return res.status(401).json({ message: 'Apenas ONGs podem criar eventos.' })

    const { titulo, descricao, data, horario, categoria } = req.body
    if (!titulo || !descricao || !data || !horario || !categoria) {
        return res.status(400).json({ message: 'Campos obrigatórios: titulo, descricao, data, horario, categoria.' })
    }

    // Mapa de categoria para imagem
    const imagemMap = {
        saude: '../img/home/filtro/saudef.png',
        animais: '../img/home/filtro/animaisf.png',
        comida: '../img/home/filtro/comidaf.png',
        idosos: '../img/home/filtro/idososf.png',
        reciclagem: '../img/home/filtro/reciclagemf.png',
        coleta: '../img/home/filtro/coletaf.png'
    }

    const evento = {
        ongId: ong.id,
        ongNome: ong.nome,
        titulo,
        descricao,
        data,
        horario,
        categoria,
        imagem: imagemMap[categoria] || '../img/home/filtro/saudef.png'
    }

    const criado = eventosRepo.create(evento)
    res.status(201).json({ message: 'Evento criado com sucesso!', evento: criado })
})

// DELETE /eventos/:id — apagar evento (somente a ONG dona)
eventosRoutes.delete('/eventos/:id', (req, res) => {
    const ong = autenticarONG(req)
    if (!ong) return res.status(401).json({ message: 'Apenas ONGs podem apagar eventos.' })

    const deletado = eventosRepo.delete(Number(req.params.id), ong.id)
    if (!deletado) return res.status(403).json({ message: 'Evento não encontrado ou não pertence a esta ONG.' })

    res.status(200).json({ message: 'Evento apagado com sucesso.' })
})

export default eventosRoutes
