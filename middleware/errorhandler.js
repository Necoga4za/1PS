module.exports = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500; 
    
    res.status(statusCode); 

    res.json({
        title: err.name || "Error", 
        message: err.message || '서버 오류 발생',
        
        stackTrace: process.env.NODE_ENV === "development" ? err.stack : null,
    });
};