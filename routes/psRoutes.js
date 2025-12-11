// routes/psRoutes.js (수정된 최종 버전)

const express = require('express');
const router = express.Router();
const { validateToken, optionalTokenCheck } = require('../middleware/validateTokenHandler');
const { 
    getUploadPage, 
    createPsPost, 
    getMainPage, 
    getMyPosts, 
    getLikesPage,
    getPsPostDetails, // 상세 페이지 컨트롤러
    toggleLike,
    updatePsPost, 
    deletePsPost
} = require('../controllers/psController'); 
const { uploadSingleImage } = require('../config/uploadConfig');


// 1. 명확한 URL을 가진 라우트들
router.get("/my-posts", validateToken, getMyPosts); 
router.get("/likes", validateToken, getLikesPage); 
router.get("/upload", validateToken, getUploadPage); 

// 2. POST 라우트
router.post("/submit-upload", validateToken, uploadSingleImage, createPsPost); 
router.post("/like-post/:id", validateToken, toggleLike);

// 3. 동적 ID를 사용하는 라우트들
router.get("/posts/:id", optionalTokenCheck, getPsPostDetails); 
router.put("/posts/:id", validateToken, updatePsPost);
router.delete("/posts/:id", validateToken, deletePsPost);

// 🚨 CRITICAL FIX: 메인 페이지 라우트는 항상 가장 마지막에 위치해야 합니다.
router.get("/", optionalTokenCheck, getMainPage); 

module.exports = router;