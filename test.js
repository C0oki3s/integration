const express = require("express")
const rateLimit = require("express-rate-limit")



const app = express()
app.use(express.json())

const Limiter = rateLimit({
    windowMs: 6000,
    max: 6,
    message:
    "Too many accounts created from this IP, please try again after an hour"
})



app.get("/",Limiter,(req,res)=>{res.send(req.rateLimit)})


app.listen(5000)