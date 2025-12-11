// models/Post.js

const mongoose = require('mongoose');
const slugify = require('slugify'); 
const PostSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, '제목은 필수 입력 사항입니다.'],
        trim: true
    },
    
    content: {
        type: String,
        required: [true, '내용은 필수 입력 사항입니다.']
    },
    category: {
        type: String,
        default: 'General'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
    },
    slug: {
        type: String,
        unique: true
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true 
});

PostSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isNew) {
        this.slug = slugify(this.title, { lower: true, strict: true, locale: 'ko' });
    }
    next();
});

module.exports = mongoose.model('PostModel', PostSchema);