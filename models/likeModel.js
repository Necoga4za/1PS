// models/likeModel.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    

    psPostId: { 
        type: Schema.Types.ObjectId,
        ref: 'PsPost', 
        required: true 
    },
}, {
    timestamps: true,
});


likeSchema.index({ userId: 1, psPostId: 1 }, { unique: true }); 

module.exports = mongoose.model("Like", likeSchema);