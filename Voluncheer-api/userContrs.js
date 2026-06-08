import userRepo from './userRepo.js'

export function getAllUsers(req,res){
    const users = userRepo.readAll()
    res.status(200).json(users) 
}

export function getVoluntarios(req,res){
    const voluntarios = userRepo.readVoluntarios()
    res.status(200).json(voluntarios) 
}

export function getONGs(req,res){
    const ongs = userRepo.readONGs()
    res.status(200).json(ongs)
}
