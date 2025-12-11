const asyncHandler = require("express-async-handler");
const PsPost = require("../models/psPostModel");
const User = require("../models/userModel");
const Like = require("../models/likeModel");
// const fs = require('fs');
const cloudinary = require('cloudinary').v2;
// const Post = require('../models/PostModel');

// @desc    1 P.S. 메인 페이지 뷰
// @route   GET /
// @access  Public (Optional Login)
const getMainPage = asyncHandler(async (req, res) => {
    const posts = await PsPost.find().sort({ createdAt: -1 }); 
    res.render('1ps', { posts, user: req.user || null }); 
});


// @desc    Upload 페이지 뷰
// @route   GET /upload
// @access  Private
const getUploadPage = asyncHandler(async (req, res) => {
    res.render('upload', {
        title: 'Upload P.S.',
        user: req.user
    });
});

// @desc    새 PostScript(PS) 업로드 및 저장
// @route   POST /submit-upload
// @access  Private
const createPsPost = asyncHandler(async (req, res) => {
    const { postText } = req.body;
    
    // 디버깅 코드 (이제 필요 없으면 제거하셔도 됩니다)
    console.log("--- req.file 내용 ---");
    console.log(req.file);
    console.log("-----------------------");
    
    // req.file에는 Cloudinary에 업로드된 정보가 들어있습니다.
    if (!req.file || !postText) {
        res.status(400);
        
        // 🚨 CRITICAL FIX 1: 롤백 시 req.file.filename을 사용합니다.
        if (req.file && req.file.filename) { 
             await cloudinary.uploader.destroy(req.file.filename); // public_id 대신 filename 사용
             console.log(`Cloudinary 롤백 완료: ${req.file.filename}`);
        } 
        
        throw new Error("이미지 파일과 텍스트를 모두 입력해야 합니다.");
    }

    // 🚨 CRITICAL FIX 2: PsPost 생성 시 req.file.filename을 publicId로 전달합니다.
    const newPsPost = await PsPost.create({
        userId: req.user.id,
        imagePath: req.file.path || req.file.secure_url, 
        publicId: req.file.filename, // <-- public_id 대신 filename 사용!
        postText: postText
    });
    
    req.flash('success', '새로운 P.S.가 성공적으로 업로드되었습니다.');
    res.redirect('/'); 
});
// 내 게시물 목록
const getMyPosts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const myPosts = await PsPost.find({ userId: userId }).sort({ createdAt: -1 }); 
    
    res.render('my-posts', { 
        title: 'My Posts',
        posts: myPosts,
        user: req.user
    }); 
});

// 좋아요 목록 뷰
// 좋아요 목록 뷰
const getLikesPage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // 🚨 FIX 1: postId 대신 스키마 필드 이름인 'psPostId'를 선택합니다.
    const likedRecords = await Like.find({ userId: userId }).select('psPostId'); 
    
    // 🚨 FIX 2: record.postId 대신 record.psPostId를 사용합니다.
    const likedPostIds = likedRecords.map(record => record.psPostId);
    
    if (!likedPostIds.length) {
        return res.render('likes', { 
            title: 'Likes',
            posts: [],
            user: req.user
        });
    }

    const likedPosts = await PsPost.find({ 
        '_id': { $in: likedPostIds } 
    }).sort({ createdAt: -1 }); 

    res.render('likes', { 
        title: 'Likes',
        posts: likedPosts,
        user: req.user
    });
});

// 좋아요 상태
// controllers/psController.js (toggleLike 함수)

// 좋아요 상태
const toggleLike = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id; // URL 파라미터는 게시물 ID

    const post = await PsPost.findById(postId); 

    if (!post) {
        return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }

    // 🚨 FIX 1: 중복된 Like.findOne() 호출을 제거하고,
    // 스키마 필드 이름인 'psPostId'를 사용하여 좋아요 기록을 찾습니다.
    const likeRecord = await Like.findOne({ 
        userId: userId, 
        psPostId: postId // <--- 스키마 필드 이름 사용
    });
    
    let message = "";
    let isLiked = false;

    if (likeRecord) {
        // 좋아요 취소 (삭제)
        // 🚨 FIX 2: 삭제 시에도 스키마 필드 이름인 'psPostId'를 사용합니다.
        await Like.deleteOne({ userId, psPostId: postId }); 
        
        message = "좋아요가 취소되었습니다.";
        isLiked = false;
        post.likes = Math.max(0, post.likes - 1); 
    } else {
        // 좋아요 생성
        // 🚨 CRITICAL FIX 3: 생성 시에도 스키마 필드 이름인 'psPostId'를 사용합니다.
        await Like.create({ userId, psPostId: postId }); 
        
        message = "게시물에 좋아요를 눌렀습니다.";
        isLiked = true;
        post.likes += 1; // 카운트 증가
    }

    // PsPost 모델의 likes 필드 업데이트 저장
    await post.save();  

    res.status(200).json({ 
        message: message, 
        isLiked: isLiked,
        newLikesCount: post.likes
    });
});

// 게시물 수정
// @route   PUT /posts/:id
// @access  Private (게시물 작성자만)
const updatePsPost = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const { postText } = req.body;
    
    if (!postText) {
        res.status(400);
        throw new Error("수정할 텍스트를 입력해야 합니다.");
    }

    const post = await PsPost.findById(postId);

    if (!post) {
        res.status(404);
        throw new Error("게시물을 찾을 수 없습니다.");
    }
    
    // 작성자 확인
    if (post.userId.toString() !== req.user.id) {
        res.status(403);
        throw new Error("게시물을 수정할 권한이 없습니다.");
    }

    post.postText = postText;
    await post.save();

    res.status(200).json({ message: "게시물이 성공적으로 수정되었습니다.", newText: post.postText });
});


// 게시물 삭제
// @route   DELETE /posts/:id
const deletePsPost = asyncHandler(async (req, res) => {
    const postId = req.params.id;

    const post = await PsPost.findById(postId);
    
    if (!post) {
        res.status(404);
        throw new Error("게시물을 찾을 수 없습니다.");
    }

    if (post.userId.toString() !== req.user.id) {
        res.status(403);
        throw new Error("게시물을 삭제할 권한이 없습니다.");
    }
    
    // 🚨 FIX 2.3: Cloudinary 삭제 로직 적용 (로컬 fs 로직은 주석 처리 또는 제거)
    if (post.publicId) {
        await cloudinary.uploader.destroy(post.publicId);
    } else {
        // publicId가 DB에 없을 경우 URL에서 추출하여 삭제 시도 (선택 사항: 이전 버전 호환용)
        const imagePath = post.imagePath;
        if (imagePath && imagePath.startsWith('http')) {
            const urlParts = imagePath.split('/');
            const publicIdWithFolder = urlParts.slice(-2).join('/').split('.')[0]; 
            await cloudinary.uploader.destroy(publicIdWithFolder);
        }
    }
    
    await Like.deleteMany({ psPostId: postId }); // 좋아요 삭제
    await PsPost.deleteOne({ _id: postId }); // 게시물 삭제

    res.status(200).json({ message: "게시물이 성공적으로 삭제되었습니다." });
});

//     const imagePath = post.imagePath.startsWith('/uploads/')
//         ? post.imagePath.substring('/uploads/'.length)
//         : null;

//     if (imagePath) {
//         const fullPath = `./public/uploads/${imagePath}`;
//         if (fs.existsSync(fullPath)) {
//             fs.unlinkSync(fullPath);
//             console.log(`파일 삭제 완료: ${fullPath}`);
//         } else {
//             console.log(`경고: 파일을 찾을 수 없습니다: ${fullPath}`);
//         }
//     }
    
//     await Like.deleteMany({ postId: postId });

//     await PsPost.deleteOne({ _id: postId });

//     res.status(200).json({ message: "게시물이 성공적으로 삭제되었습니다." });
// });

// @desc    특정 PostScript(PS) 상세 페이지 뷰
// @route   GET /posts/:id
// @access  Public (Optional Login)
const getPsPostDetails = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    
    // Mongoose가 여기서 ObjectId 캐스팅 오류를 냅니다.
    // 하지만 올바른 ID가 전달되면 게시물을 찾습니다.
    const post = await PsPost.findById(postId).populate('userId', 'name');

    if (!post) {
        res.status(404);
        throw new Error("게시물을 찾을 수 없습니다.");
    }
    
    res.render('post-details', { 
        title: post.postText.substring(0, 20),
        post: post, 
        user: req.user || null 
    });
});


module.exports = {
    getMainPage,
    getUploadPage,
    createPsPost,
    getPsPostDetails,
    getMyPosts, 
    getLikesPage,
    toggleLike,
    updatePsPost, 
    deletePsPost
};