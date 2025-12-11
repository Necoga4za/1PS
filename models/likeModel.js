const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },

    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'PsPost',
    },
}, {
    timestamps: true,
});


likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);