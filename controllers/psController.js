const asyncHandler = require("express-async-handler");
const PsPost = require("../models/psPostModel");
const User = require("../models/userModel");
const Like = require("../models/likeModel");
// const fs = require('fs');
const cloudinary = require('cloudinary').v2;


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
    
    if (!req.file || !postText) {
        res.status(400);
        
        // 💡💡💡 수정: 로컬 fs.unlinkSync 제거, Cloudinary 롤백 로직 추가
        if (req.file && req.file.public_id) {
            await cloudinary.uploader.destroy(req.file.public_id);
            console.log(`Cloudinary 롤백: ${req.file.public_id} 삭제됨.`);
        }
        
        throw new Error("이미지 파일과 텍스트를 모두 입력해야 합니다.");
    }
    
    // 💡💡💡 핵심: Cloudinary URL (req.file.path) 저장 확인
    const newPsPost = await PsPost.create({
        userId: req.user.id,
        imagePath: req.file.path, // req.file.path에는 Cloudinary URL이 들어 있습니다.
        postText,
    });

    res.redirect('/');
});


// const createPsPost = asyncHandler(async (req, res) => {
//     const { postText } = req.body;
    
//     if (!req.file || !postText) {
//         res.status(400);
//         if (req.file) {
//             fs.unlinkSync(req.file.path);
//         }
//         throw new Error("이미지 파일과 텍스트를 모두 입력해야 합니다.");
//     }

//     const psPost = await PsPost.create({
//        userId,
//         imagePath,
//         postText,
//     });

//     if (psPost) {
//         res.status(201).redirect('/'); 
//     } else {
//         fs.unlinkSync(req.file.path);
//         res.status(500);
//         throw new Error("게시글 저장에 실패했습니다.");
//     }
// });


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
const getLikesPage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const likedRecords = await Like.find({ userId: userId }).select('postId');
    
    const likedPostIds = likedRecords.map(record => record.postId);
    
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
const toggleLike = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id;

    const post = await PsPost.findById(postId); 

    if (!post) {
        return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }

    
    const likeRecord = await Like.findOne({ userId, postId });
    
    let message = "";
    let isLiked = false;

    if (likeRecord) {
        await Like.deleteOne({ userId, postId });
        message = "좋아요가 취소되었습니다.";
        isLiked = false;
        post.likes = Math.max(0, post.likes - 1); 
    } else {
        await Like.create({ userId, postId });
        message = "게시물에 좋아요를 눌렀습니다.";
        isLiked = true;
        post.likes += 1; // 카운트 증가
    }

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


// @desc    게시물 삭제 (Cloudinary 로직)
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

    const imagePath = post.imagePath;

    if (imagePath && imagePath.startsWith('http')) {
        try {
            const urlParts = imagePath.split('/');
            const publicIdWithFormat = urlParts.slice(-2).join('/'); 
            const publicId = publicIdWithFormat.split('.')[0]; 

            await cloudinary.uploader.destroy(publicId);
            console.log(`Cloudinary 파일 삭제 완료: ${publicId}`);

        } catch (error) {
            console.error("Cloudinary 파일 삭제 중 오류 발생:", error.message);
        }
    } else {
        console.log(`경고: Cloudinary URL이 아닙니다. 파일 삭제를 건너뛰고 DB 기록만 삭제합니다.`);
    }
    
    await Like.deleteMany({ postId: postId });
    await PsPost.deleteOne({ _id: postId });

    res.status(200).json({ message: "게시물이 성공적으로 삭제되었습니다." });
});
// const deletePsPost = asyncHandler(async (req, res) => {
//     const postId = req.params.id;

//     const post = await PsPost.findById(postId);
    

//     if (!post) {
//         res.status(404);
//         throw new Error("게시물을 찾을 수 없습니다.");
//     }

//     if (post.userId.toString() !== req.user.id) {
//         res.status(403);
//         throw new Error("게시물을 삭제할 권한이 없습니다.");
//     }

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


module.exports = {
    getMainPage,
    getUploadPage,
    createPsPost,
    getMyPosts, 
    getLikesPage,
    toggleLike,
    updatePsPost, 
    deletePsPost
};