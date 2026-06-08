import {Router} from "express"

const basicRoutes = Router()

basicRoutes.get("/",(req,res)=>{
    res.status(200).json({
        system: "Aula 004 Unifoa",
        ok: true
    })
})

basicRoutes.get("/sobre",(req,res)=>{
    res.status(200).json({
        system: "Aula 003 Unifoa",
        author: "Turma SI período 3",
        ano: 2026
    })
})

export default basicRoutes