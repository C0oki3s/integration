const mongoose = require("mongoose")

const users = mongoose.Schema({
    username: {
        type: String,
        require:true,
        unique:true,
        trim:true
    },
    email: {
        type: String,
        require:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        require:true,
        unique:true,
        trim:true
    },
    comments:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
    }]
})

module.exports = mongoose.model("user",users)