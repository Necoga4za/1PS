// middleware/isAdminHandler.js
const asyncHandler = require("express-async-handler");

require("dotenv").config(); 
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; 

const isAdmin = asyncHandler(async (req, res, next) => {

    if (!req.user || !req.user.email) { 
        const forbiddenScript = `
            <script>
                alert('로그인이 필요합니다.');
                window.location.href = '/login'; 
            </script>
        `;
        return res.status(401).send(forbiddenScript);
    }
    // 2. 관리자 이메일
    if (req.user.email !== ADMIN_EMAIL) { 
        const forbiddenScript = `
            <script>
                alert('접근 권한이 없습니다. 관리자만 접근할 수 있습니다.');
                window.location.href = '/'; 
            </script>
        `;
        return res.status(403).send(forbiddenScript);
    }

    next();
});

module.exports = isAdmin;