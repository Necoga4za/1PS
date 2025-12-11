// models/likeModel.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    
    // 🚨 FIX 1: 'postId' 필드는 완전히 제거하고 'psPostId'만 남깁니다.
    psPostId: { 
        type: Schema.Types.ObjectId,
        ref: 'PsPost', 
        required: true 
    },
}, {
    timestamps: true,
});

// 🚨 FIX 2: 인덱스도 'psPostId'로 통일합니다.
likeSchema.index({ userId: 1, psPostId: 1 }, { unique: true }); 

module.exports = mongoose.model("Like", likeSchema);