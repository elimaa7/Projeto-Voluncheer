import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const p = path.join(__dirname, './eventos.json')

const eventosRepo = {
    readAll() {
        const data = fs.readFileSync(p, 'utf-8')
        return JSON.parse(data || '[]')
    },
    readById(id) {
        return this.readAll().find(e => e.id === id) || null
    },
    readByOng(ongId) {
        return this.readAll().filter(e => e.ongId === ongId)
    },
    create(evento) {
        const eventos = this.readAll()
        evento.id = eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1
        evento.criadoEm = new Date().toISOString()
        eventos.push(evento)
        fs.writeFileSync(p, JSON.stringify(eventos, null, 2))
        return evento
    },
    delete(id, ongId) {
        const eventos = this.readAll()
        const idx = eventos.findIndex(e => e.id === id && e.ongId === ongId)
        if (idx === -1) return false
        eventos.splice(idx, 1)
        fs.writeFileSync(p, JSON.stringify(eventos, null, 2))
        return true
    }
}

export default eventosRepo
