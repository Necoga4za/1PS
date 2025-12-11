const jwt = require("jsonwebtoken");

const setAuthStatus = (req, res, next) => {
    let token = req.cookies.token; 

    if (!token) {
        res.locals.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.clearCookie('token'); 
            res.locals.user = null;
            return next();
        }
        
        req.user = decoded.user;
        res.locals.user = decoded.user; 
        
        next();
    });
};

module.exports = setAuthStatus;