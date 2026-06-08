import { Router } from 'express'
import { getAllUsers, getVoluntarios, getONGs } from './userContrs.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const p = path.join(__dirname, './usuarios.json')

const userRoutes = Router()

userRoutes.get('/usuarios',    getAllUsers)
userRoutes.get('/voluntarios', getVoluntarios)
userRoutes.get('/ongs',        getONGs)

const lerUsuarios = () => JSON.parse(fs.readFileSync(p, 'utf-8') || '[]')

// ── Cadastro ──────────────────────────────────────────────
userRoutes.post('/cadastrar', (req, res) => {
  const { nome, email, senha, tipo, ...extras } = req.body

  // Validação backend
  if (!nome || nome.trim().length < 2)
    return res.status(400).json({ message: 'Nome deve ter pelo menos 2 caracteres.' })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email.trim()))
    return res.status(400).json({ message: 'Digite um e-mail válido.' })

  if (!senha || senha.length < 6)
    return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' })

  if (!tipo || !['voluntario', 'ong'].includes(tipo))
    return res.status(400).json({ message: 'Tipo inválido.' })

  const usuarios = lerUsuarios()

  // Email duplicado
  if (usuarios.find(u => u.email === email.trim()))
    return res.status(400).json({ message: 'Este e-mail já está cadastrado.' })

  const novoUsuario = {
    id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
    nome: nome.trim(),
    email: email.trim(),
    senha,
    tipo,
    ...extras
  }

  usuarios.push(novoUsuario)
  fs.writeFileSync(p, JSON.stringify(usuarios, null, 2))

  // Retorna sem a senha
  const { senha: _, ...userSemSenha } = novoUsuario
  res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: userSemSenha })
})

// ── Login ─────────────────────────────────────────────────
userRoutes.post('/login', (req, res) => {
  const { email, senha, tipo } = req.body

  if (!email || !senha || !tipo)
    return res.status(400).json({ message: 'Preencha todos os campos.' })

  const usuarios = lerUsuarios()
  const user = usuarios.find(u =>
    u.email === email.trim() &&
    u.senha === senha &&
    u.tipo  === tipo
  )

  if (!user)
    return res.status(401).json({ message: 'E-mail, senha ou tipo incorretos.' })

  // Nunca retorna a senha
  const { senha: _, ...userSemSenha } = user
  res.status(200).json({ message: 'Login realizado!', user: userSemSenha })
})

export default userRoutes
