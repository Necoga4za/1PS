// middleware/validateTokenHandler.js

const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

//  1. 로그인이 필수인 경우 (validateToken)
const validateToken = asyncHandler(async (req, res, next) => {
    let token = req.cookies.token; 
    
    if (!token) {
        // 토큰이 없으면 로그인 페이지로 리디렉션
        const loginRequiredScript = `
            <script>
                alert('로그인이 필요한 서비스입니다.');
                window.location.href = '/login';
            </script>
        `;
        return res.status(401).send(loginRequiredScript);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // 토큰이 만료되었거나 유효하지 않으면 쿠키 삭제 후 리디렉션
            res.clearCookie('token'); 
            const sessionExpiredScript = `
                <script>
                    alert('세션이 만료되었거나 유효하지 않은 접근입니다. 다시 로그인해주세요.');
                    window.location.href = '/login';
                </script>
            `;
            return res.status(401).send(sessionExpiredScript);
        }
        
        req.user = decoded.user; 
        next();
    });
});


// 2. 로그인이 선택인 경우 (optionalTokenCheck)
const optionalTokenCheck = asyncHandler(async (req, res, next) => {
    let token = req.cookies.token; 
    
    if (!token) {
        req.user = null; 
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.clearCookie('token'); 
            req.user = null;
        } else {
            req.user = decoded.user; 
        }
        next(); 
    });
});


module.exports = { 
    validateToken, 
    optionalTokenCheck 
};