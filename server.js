// server.js

const express = require("express");
const dotenv = require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const session = require('express-session'); 
const flash = require('connect-flash');   
const port = process.env.PORT || 4000; 
const connectDB = require("./config/dbConnection");
const psRoutes = require('./routes/psRoutes');
const userRoutes = require('./routes/userRoutes'); 
const errorHandler = require('./middleware/errorhandler'); 
const adminRoutes = require('./routes/adminRoutes'); 
const methodOverride = require('method-override');
const configureCloudinary = require('./config/cloudinaryConfig');

configureCloudinary();
connectDB(); 


app.use(express.static('public')); 

app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", "./views"); 


app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());


app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } 
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