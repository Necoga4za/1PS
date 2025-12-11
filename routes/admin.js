// routes/admin.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/posts', adminController.getPostsList);
router.get('/posts/add', adminController.getAddPost);
router.post('/posts', adminController.postAddPost);
router.get('/posts/edit/:postId', adminController.getEditPost);
router.put('/posts/:postId', adminController.putEditPost);
router.delete('/posts/:postId', adminController.deletePost);

module.exports = router;