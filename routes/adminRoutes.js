// routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const { validateToken } = require("../middleware/validateTokenHandler"); 
const isAdmin = require("../middleware/isAdminHandler"); 
const { uploadSingleImage } = require('../config/uploadConfig'); 
const adminController = require("../controllers/adminController");


router.post('/', adminController.loginAdmin);
// =====================================
// 모든 관리자 경로에 인증 및 권한 확인 미들웨어
// =====================================
router.use(validateToken, isAdmin); 

// =====================================
// 1. 관리자 대시보드 (Admin Dashboard)
// =====================================
router.get("/", adminController.getAdminDashboard); 


// =====================================
// 2. 사용자 관리 (User Management)
// =====================================
router.get("/users", adminController.getAllUsers); 
router.get("/users/add", adminController.getAddUserPage); 
router.post("/users", adminController.createUser);
router.get("/users/:id", adminController.getUser); 
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);


// =====================================
// 3. 게시물 관리 (Post Management)
// =====================================
router.get("/posts", adminController.getAllPosts); 
router.get("/posts/add", adminController.getAddPostPage); 
router.post("/posts", uploadSingleImage, adminController.createPost); 
router.get("/posts/edit/:id", adminController.getEditPostPage); 
router.put("/posts/:id", adminController.updatePost); // PUT
router.delete("/posts/:id", adminController.deletePost);

// =====================================
// 4. 좋아요 관리 (Likes Management) 
// =====================================
router.get("/likes", adminController.getAllLikes); 
router.delete("/likes/:id", adminController.deleteLike); 

// =====================================
// 5. P.S. 게시물 관리 (PsPost Management)
// =====================================
router.get("/ps-posts", adminController.getAllPsPosts); 
router.get("/ps-posts/:id", adminController.getEditPsPostPage); 
router.put("/ps-posts/:id", adminController.updatePsPost); 
router.delete("/ps-posts/:id", adminController.deletePsPost);

module.exports = router;