const express = require("express")
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const database = require("./models/users")
const Comment = require("./models/comments")


const app = express()

JWT_SECRET = 'b43797b4a91f6a74f8abf356d879b1733cb6b080bf945a7469efefd337d8d41727f1751d4d041df40ec0c1fce8def07e32e4'

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookieParser())
app.set("view engine","ejs")
mongoose.connect("mongodb://localhost:27017/blog")



app.get("/",(req,res)=>{
    const {s} = req.query 
    res.send(`
    <html>
    <head>
        <style>
        h1{
            text-align: center;
        }
        </style>
        </head>
        <body>
        <h1 id="demo">${s}</h1>
        </body>
        </html>
    `)
})

app.post("/register",async(req,res)=>{
    const {username, password, email} = req.body
    errors = []
    if(!username || !password || !email){
        res.json({message: "Err"})
    }else{
        const check = await database.find({username:username})
        const check1 = await database.find({email:email})
        if(check.length > 0){
            res.send("user already exists")
        }else if(check1.length > 0){
            res.send("user already exists")
        }else{
            try {
                const db = await new database({
                    username: username,
                    password: password,
                    email:email
                })
            db.save()
            res.send({message:db})
            } catch (error) {
                res.send(error.message)
            }
        }
    }
})

app.get("/login",async(req,res)=>{
    const {jwt_token} = req.cookies
    try {
        if(jwt_token){
            const decode  = await jwt.verify(jwt_token,JWT_SECRET)
            res.send(`Hello ${decode.username} your Email is ${decode.email}`)
        }else{
            res.render("index")
        }
    } catch (error) {
        res.render("index")
    }
})

const middleware = require("./middleware/middleware")
app.post("/login",middleware.verify,async(req,res)=>{
    const {username, password} = req.body
    if(!username || !password ){
        res.send("Please Enter both username and password")
    }else{
    try {
        const query = {username:username}
        const user = await database.find(query)
        if(user.length > 0){
            if(password === user[0].password){
                const token = await jwt.sign({username:username,email: user[0].email,exp: Math.floor(Date.now() / 1000) + (60 * 60)},JWT_SECRET)   
                res.cookie("jwt_token",token)
                res.json({message:"Ok"})
            }else{
                res.json({message:"password incorrect"})
            }
        }else{
            res.json({message:"Users does not exists"})
        }
    } catch (error) {
        res.send("err")
    }
}
})

app.get("/blog",async(req,res)=>{
    try {
        const data = await Comment.find({})
        const name = await database.find({}, {"username": 1})
        if(data.length > 0){
            res.render("blog",{data:data,name:name})
        }else{
            res.render("blog")
        }
    } catch (error) {
        res.send(error)
    }
})

app.post("/comment",
[middleware.check_token,middleware.check_user]
,async(req,res)=>{
        try {
            const query = {text:req.body.comment}
            const comment = await new Comment(query)
            await comment.save()
            const post = await database.findById(req.userID)
            post.comments.push(comment);
            const result = await post.save()
            res.redirect("/blog")
        } catch (error) {
            res.send(error.message)
        }
})

app.get("/user",
[middleware.check_token,middleware.check_user]
,(req,res)=>{
    try {
        res.send(`
        <head>
        <style>
        div{
            text-align: center;
        }
        </style>
        </head>
        <div>
        <span>
        <h3>UserName: ${req.database[0].username}</h3>
        <h3>Email: ${req.database[0].email}</h3>
        <h3>Password: ${req.database[0].password}</h3>
        </span>
        <div>
        `)
    } catch (error) {
        res.send(401)
    }
})


app.listen(5000)