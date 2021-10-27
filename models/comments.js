const mongoose = require("mongoose")

const comment = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
        required: true
     }
})

module.exports = mongoose.model("comment",comment)