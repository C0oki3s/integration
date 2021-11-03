const axios = require("axios").default
const jwt = require("jsonwebtoken")
const database = require("../models/users")
const dotenv = require("dotenv")
const { google } = require("googleapis")
dotenv.config()

let middleware = {}
JWT_SECRET = 'b43797b4a91f6a74f8abf356d879b1733cb6b080bf945a7469efefd337d8d41727f1751d4d041df40ec0c1fce8def07e32e4'
const oauth2client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT,
    process.env.OAUTH_SECRET,
    process.env.OAUTH_REDIRECT,
)

middleware.verify = async (req, res, next) => {
    const { captcha } = req.body
    if (!captcha) {
        return res.json({ message: "Plase send Captcha" })
    } else {
        const CaptchaKey = "6LcpxPEcAAAAADnXBTx4baMPerjlHFxNbmwb6dOH"
        const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${CaptchaKey}&response=${captcha}`
        axios.get(verifyURL)
            .then((response) => {
                if (response.data.success) {
                    next()
                } else {
                    return res.status(429).json({ message: 'Re-using captcha' })
                }
            })
    }
}
middleware.check_token = async (req, res, next) => {
    const { jwt_token } = req.cookies
    if (jwt_token == null) return res.redirect("/login")
    try {
        jwt.verify(jwt_token, JWT_SECRET, (err, user) => {
            if (err) {
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

middleware.check_user = async (req, res, next) => {
    try {
        const query = { username: req.user.username }
        const checkdb = await database.find(query)
        if (checkdb.length > 0) {
            req.userID = checkdb[0].id
            req.database = checkdb
            next()
        } else {
            return res.send("User do not exists")
        }
    } catch (error) {
        res.send("err from check_user")
    }
}

middleware.googleAuth = async (req, res, next) => {
    const { code } = req.query
    try {
        const { tokens } = await oauth2client.getToken(code)
        oauth2client.setCredentials(tokens)
        await oauth2client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.OAUTH_CLIENT
        })
            .then((response) => {
                console.log("GOOGLE LOGIN RESPONSE", response.payload)
                const { email_verified, email, name } = response.payload
                if (email_verified) {
                    database.findOne({ email }).exec(async (err, user) => {
                        if (user) {
                            const token = await CreateToken(user)
                            res.cookie("jwt_token", token)
                            return res.status(200).json({
                                user: {
                                    user_id: user._id,
                                    username: user.username,
                                    email: user.email
                                }
                            })
                        } else {
                            let password = name + "_" + email
                            user = new database({
                                username: name,
                                email: email,
                                password:password
        
                            })
                            user.save(async(err,data)=>{
                                if(err){
                                    console.log(err)
                                    return res.status(400).json({message:"Error wile saving"})
                                }
                                const token = await CreateToken(user)
                                res.cookie("jwt_token",token)
                                return res.status(201).json({                               
                                    user: {
                                    user_id: user._id,
                                    username: user.username,
                                    email: user.email
                                }})
                            })
                        }
                    })
                }else{
                    return res.status(400).json({
                        error: "Google login failed. Try again",
                    });
                }
            }).catch((err)=>{
                return res.status(401).json({ message: "invalid token" })
            })
    } catch (error) {
        return res.status(401).json({ message: "invalid token" })
    }
}

async function CreateToken(user) {
    const { username, email } = user
    try {
        const token = await jwt.sign({ username: username, email: email, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, JWT_SECRET)
        return token
    } catch (error) {
        console.log("Error Occured Signing Access Token ", err);
    }
}

module.exports = middleware;