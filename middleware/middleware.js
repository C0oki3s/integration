const axios = require("axios").default
const jwt = require("jsonwebtoken");
const database = require("../models/users");

let middleware ={}
JWT_SECRET = 'b43797b4a91f6a74f8abf356d879b1733cb6b080bf945a7469efefd337d8d41727f1751d4d041df40ec0c1fce8def07e32e4'

middleware.verify = async (req,res,next)=>{
    const {captcha} = req.body
    if(!captcha){
        return res.json({message:"Plase send Captcha"})
    }else{
        const CaptchaKey="6LcpxPEcAAAAADnXBTx4baMPerjlHFxNbmwb6dOH"
        const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${CaptchaKey}&response=${captcha}`
        axios.get(verifyURL)
        .then((response)=>{
            if(response.data.success){
                next()
            }else{
                return res.status(429).json({message:'Re-using captcha'})
            }
        })
    }
}
middleware.check_token = async (req,res,next)=>{
    const {jwt_token} = req.cookies
    if(jwt_token == null) return res.redirect("/login")
    try {
        jwt.verify(jwt_token,JWT_SECRET,(err,user)=>{
            if(err){
                return res.send("JWT expired")
            }
            req.user = user
            next()
        }) 
    } catch (error) {
        console.log(error)
        return res.redirect("/login")
    }
}

middleware.check_user=async(req,res,next)=>{
    try {
        const query = {username: req.user.username} 
        const checkdb = await database.find(query)
        if(checkdb.length >0 ){
            req.userID = checkdb[0].id
            req.database = checkdb
            next()
        }else{
            return res.send("User do not exists")
        }
    } catch (error) {
        res.send("err from check_user")
    }
}

module.exports = middleware;