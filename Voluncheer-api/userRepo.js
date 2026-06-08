import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const p = path.join(__dirname, './usuarios.json')

const userRepo = {
    readAll() {
        return JSON.parse(fs.readFileSync(p, 'utf-8') || '[]')
    },
    readVoluntarios() {
        return this.readAll().filter(u => u.tipo === 'voluntario')
    },
    readONGs() {
        return this.readAll().filter(u => u.tipo === 'ong')
    }
}

export default userRepo