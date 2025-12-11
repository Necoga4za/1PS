// models/psPostModel.js

const mongoose = require('mongoose');

const psPostSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
    },

    imagePath: {
        type: String,
        required: true
    },


    publicId: {
        type: String,
        required: true 
    },
    
    postText: {
        type: String,
        required: true
    },

    likes: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true 
});

module.exports = mongoose.model('PsPost', psPostSchema);