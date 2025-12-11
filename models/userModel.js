const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

    name: {
        type: String,
        required: [true, "이름은 필수 항목입니다."],
    },
    email: {
        type: String,
        required: [true, "이메일은 필수 항목입니다."],
        unique: [true, "이미 등록된 이메일입니다."],
    },

    phone: {
        type: String,
        required: [true, "전화번호는 필수 항목입니다."],
    },
    password: {
        type: String,
        required: [true, "비밀번호는 필수 항목입니다."],
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("User", userSchema);