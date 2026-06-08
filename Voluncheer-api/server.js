import express from 'express'
import cors from 'cors'
import basicRoutes from './basicRoutes.js'
import userRoutes from './userRoutes.js'
import eventosRoutes from './eventosRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000

app.use(basicRoutes)
app.use(userRoutes)
app.use(eventosRoutes)

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})