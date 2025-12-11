// middleware/validateTokenHandler.js

const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const validateToken = asyncHandler(async (req, res, next) => {
    let token = req.cookies.token; 
    
    if (!token) {

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