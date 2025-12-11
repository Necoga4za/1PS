// server.js

const express = require("express");
const dotenv = require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const session = require('express-session'); // ★ 추가: 세션 관리를 위함
const flash = require('connect-flash');     // ★ 추가: 에러/성공 메시지 플래시를 위함
const port = process.env.PORT || 4000; 
const connectDB = require("./config/dbConnection");
const psRoutes = require('./routes/psRoutes');
const userRoutes = require('./routes/userRoutes'); 
const errorHandler = require('./middleware/errorhandler'); 
const adminRoutes = require('./routes/adminRoutes'); // 'routes/admin.js'가 아닌 'routes/adminRoutes.js'로 설정되어 있음
const methodOverride = require('method-override');

connectDB(); 


app.use(express.static('public')); 

app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", "./views"); 


// 미들웨어
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());

// ★ 추가: 세션 설정 (flash 메시지 사용을 위해 필수)
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat', // .env 파일에 SESSION_SECRET 설정 권장
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 예시: 1시간
}));


app.use(flash());

app.use(methodOverride('_method'));

app.use((req, res, next) => {

 res.locals.user = req.user; 

   res.locals.successMessage = req.flash('success');
   res.locals.errorMessage = req.flash('error');
   next();
});


app.use('/admin', adminRoutes);

app.use('/', psRoutes); 

app.use('/', userRoutes);  


app.use(errorHandler);


app.listen(port, () => {
    console.log(`1P.S. 서버가 포트 ${port}에서 실행 중입니다.`);
});