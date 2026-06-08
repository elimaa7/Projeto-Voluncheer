import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import basicRoutes from './voluncheer-api/basicRoutes.js'
import userRoutes from './voluncheer-api/userRoutes.js'
import eventosRoutes from './voluncheer-api/eventosRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app = express()

app.use(cors())
app.use(express.json())

// Serve todos os arquivos do frontend em localhost:3000
app.use(express.static(path.join(__dirname, '/Projeto-Voluncheer')))

const PORT = process.env.PORT || 3000

app.use(basicRoutes)
app.use(userRoutes)
app.use(eventosRoutes)

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
    console.log(`Site: http://localhost:${PORT}`)
    console.log(`API:  http://localhost:${PORT}/eventos`)
})

