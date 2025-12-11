// routes/psRoutes.js 

const express = require('express');
const router = express.Router();
const { validateToken, optionalTokenCheck } = require('../middleware/validateTokenHandler');
const { 
    getUploadPage, 
    createPsPost, 
    getMainPage, 
    getMyPosts, 
    getLikesPage,
    getPsPostDetails, 
    toggleLike,
    updatePsPost, 
    deletePsPost
} = require('../controllers/psController'); 
const { uploadSingleImage } = require('../config/uploadConfig');



router.get("/my-posts", validateToken, getMyPosts); 
router.get("/likes", validateToken, getLikesPage); 
router.get("/upload", validateToken, getUploadPage); 


router.post("/submit-upload", validateToken, uploadSingleImage, createPsPost); 
router.post("/like-post/:id", validateToken, toggleLike);


router.get("/posts/:id", optionalTokenCheck, getPsPostDetails); 
router.put("/posts/:id", validateToken, updatePsPost);
router.delete("/posts/:id", validateToken, deletePsPost);


router.get("/", optionalTokenCheck, getMainPage); 

module.exports = router;