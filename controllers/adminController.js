// controllers/adminController.js


const User = require('../models/userModel');
const path = require('path');
const PsPost = require('../models/psPostModel');
const Like = require('../models/likeModel'); 
const fs = require('fs'); 
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");

// ======================================
// Post List (게시물 목록 조회)
// ======================================
/**
 * GET /admin/posts - 모든 게시물 목록을 렌더링
 */
exports.getAllPosts = async (req, res, next) => {
    try {
        const posts = await Post.find()
            .populate('author', 'name') 
            .sort({ createdAt: -1 });

        res.render('adminPostsList', {
            posts: posts,
            path: '/admin/posts'
        });

    } catch (err) {
        console.error("Error fetching all posts for admin:", err);
        next(err); 
    }
};


// ======================================
// Add Post (게시물 추가)
// ======================================
/**
 * GET /admin/posts/add - 게시물 추가 폼 렌더링
 */
exports.getAddPostPage = (req, res) => {

    res.render('adminAddPost', {
        path: '/admin/posts/add',

        errorMessage: req.flash('error'),
        enteredData: {}
    });
};

/**
 * POST /admin/posts - 새 게시물 생성 처리
 */
exports.createPost = async (req, res, next) => {
    const { title, content, category } = req.body;
    
    if (!title || !content) {
        req.flash('error', '제목과 내용을 모두 입력해야 합니다.');
        req.flash('enteredData', { title, content, category });
        
        return res.redirect('/admin/posts/add');
    }
    
    try {
        const newPost = new Post({
            title: title,
            content: content,
            category: category,
            author: req.user._id, 
        });
        
        await newPost.save();

        req.flash('success', '새 게시물이 성공적으로 등록되었습니다.');
        res.redirect('/admin/posts');

    } catch (err) {
        console.error("Error creating post:", err);
        req.flash('error', '게시물 등록에 실패했습니다. 유효성 검사를 확인해주세요.');
        req.flash('enteredData', { title, content, category });
        res.redirect('/admin/posts/add');
    }
};


// ======================================
//Edit Post (게시물 수정)
// ======================================
/**
 * GET /admin/posts/edit/:id - 게시물 수정 폼 렌더링
 */
exports.getEditPostPage = async (req, res, next) => {
    const postId = req.params.id;
    try {
        const post = await Post.findById(postId);
        
        if (!post) {
            req.flash('error', '해당 게시물을 찾을 수 없습니다.');
            return res.redirect('/admin/posts');
        }
        
        const enteredData = req.flash('enteredData')[0] || {};
        
        res.render('adminEditPost', {
            post: post, 
            path: '/admin/posts/edit',
            errorMessage: req.flash('error'),
            enteredData: enteredData 
        });

    } catch (err) {
        console.error("Error fetching post for edit:", err);
        next(err);
    }
};

/**
 * PUT /admin/posts/edit/:id - 게시물 수정 처리
 */
exports.updatePost = async (req, res, next) => {
    const postId = req.params.id;
    const { title, content, category } = req.body;
    
    if (!title || !content) {
        req.flash('error', '제목과 내용을 모두 입력해야 합니다.');
        req.flash('enteredData', { title, content, category });
        return res.redirect(`/admin/posts/edit/${postId}`);
    }
    
    try {

        const updatedPost = await Post.findByIdAndUpdate(postId, {
            $set: { title, content, category }
        }, { 
            new: true, 
            runValidators: true 
        });

        if (!updatedPost) {
            req.flash('error', '게시물 수정에 실패했습니다.');
            return res.redirect('/admin/posts');
        }

        req.flash('success', '게시물이 성공적으로 수정되었습니다.');
        res.redirect('/admin/posts');

    } catch (err) {
        console.error("Error updating post:", err);
        req.flash('error', '게시물 수정 중 오류가 발생했습니다.');
        req.flash('enteredData', { title, content, category });
        res.redirect(`/admin/posts/edit/${postId}`);
    }
};


// ======================================
// P.S. 게시물 관리 (P.S. Post Management)
// ======================================

/**
 * GET /admin/ps-posts - 모든 P.S. 게시물 목록을 렌더링
 */
exports.getAllPsPosts = asyncHandler(async (req, res, next) => {
    try {
        const psPosts = await PsPost.find()
            .populate('userId', 'name') 
            .sort({ createdAt: -1 });

        res.render('adminPsPostsList', { 
            psPosts: psPosts,
            path: '/admin/ps-posts'
        });

    } catch (err) {
        console.error("Error fetching all P.S. posts for admin:", err);
        next(err); 
    }
});



// ======================================
// Admin Controller
// ======================================

/**
 * GET /admin - 관리자 대시보드 렌더링
 */
exports.getAdminDashboard = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBlogPosts = await Post.countDocuments();
        const totalPSPosts = await PsPost.countDocuments(); 

        const totalLikesPosts = await Like.countDocuments();
        
        const dashboardData = {
            totalUsers: totalUsers,
            totalBlogPosts: totalBlogPosts,
            totalPSPosts: totalPSPosts,
            totalLikesPosts: totalLikesPosts,
        };

        res.render('adminDashboard', {
            path: '/admin',
            dashboardData: dashboardData, 
            errorMessage: req.flash('error'),
            successMessage: req.flash('success')
        });

    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        next(err);
    }
};
/**
 *isAdmin 미들웨어: 관리자 권한을 확인하는 미들웨어
 */
exports.isAdmin = (req, res, next) => {

    if (!req.user) {
        req.flash('error', '로그인이 필요합니다.');
        return res.redirect('/login'); 
    }
    
    console.log('Admin 권한 확인: 통과 (임시)');
    next();
};



// 사용자 관리 (User Management)
// ======================================

/**
 * GET /admin/users - 모든 사용자 목록을 렌더링
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }); 
        res.render('userList', { 
            users: users,
            path: '/admin/users'
        });

    } catch (err) {
        console.error("Error fetching all users for admin:", err);
        next(err);
    }
});


/**
 * GET /admin/users/:id - 특정 사용자 조회 및 수정 페이지 
 */
exports.getUser = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            req.flash('error', '사용자를 찾을 수 없습니다.');
            return res.redirect('/admin/users');
        }

        res.render('userUpdate', { 
            user: user,
            path: '/admin/users',
            errorMessage: req.flash('error'), 
            enteredData: {}
        });
        
    } catch (err) {
        console.error("Error fetching user for edit:", err);
        req.flash('error', '사용자 정보를 불러오는 중 오류가 발생했습니다.');
        next(err);
    }
});


/**
 * PUT /admin/users/:id - 특정 사용자 정보 수정 처리 
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
    const userId = req.params.id;
    const { name, email, phone, password } = req.body;
    let updateFields = { name, email, phone };

    try {
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt);
        } else {
            delete updateFields.password; 
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            req.flash('error', '사용자 수정에 실패했습니다: 사용자를 찾을 수 없습니다.');
            return res.redirect(`/admin/users/${userId}`);
        }

        req.flash('success', `${updatedUser.name} 님의 정보가 성공적으로 수정되었습니다.`);
        res.redirect('/admin/users');

    } catch (err) {
        console.error("Error updating user:", err);
        
        req.flash('error', `사용자 정보 수정 중 오류가 발생했습니다: ${err.message}`);
        res.render('userUpdate', {
            user: { _id: userId, name, email, phone }, 
            path: '/admin/users',
            errorMessage: req.flash('error'),
            enteredData: { name, email, phone, password }
        });
    }
});


/**
 * DELETE /admin/users/:id - 특정 사용자 삭제 처리
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.params.id;

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            req.flash('error', '사용자를 찾을 수 없습니다.');
            return res.redirect('/admin/users');
        }
        req.flash('success', `${deletedUser.name} 님의 계정이 성공적으로 삭제되었습니다.`);
        res.redirect('/admin/users');

    } catch (err) {
        console.error("Error deleting user:", err);
        req.flash('error', '사용자 삭제 중 오류가 발생했습니다.');
        next(err);
    }
});

// ======================================
// 사용자 추가 페이지 렌더링
// ======================================
/**
 * GET /admin/users/add - 사용자 추가 페이지 렌더링
 */
exports.getAddUserPage = (req, res, next) => {
    try {
        res.render('userAdd', {
            path: '/admin/users', 
            enteredData: req.flash('enteredData')[0] || {}, 
            errorMessage: req.flash('error')[0]
        });
    } catch (err) {
        console.error("Error rendering add user page:", err);
        next(err);
    }
};


// ======================================
//새로운 사용자 추가 처리 
// ======================================
/**
 * POST /admin/users - 새로운 사용자 추가 처리
 */
exports.createUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        req.flash('error', '이름, 이메일, 비밀번호는 필수 입력 항목입니다.');
        req.flash('enteredData', { name, email, phone });
        return res.redirect('/admin/users/add');
    }

    const userAvailable = await User.findOne({ email });
    if (userAvailable) {
        req.flash('error', '이미 등록된 이메일 주소입니다.');
        req.flash('enteredData', { name, email, phone });
        return res.redirect('/admin/users/add');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
    });

    if (newUser) {
        req.flash('success', `${newUser.name} 님 (이메일: ${newUser.email})이 성공적으로 추가되었습니다.`);
        res.redirect('/admin/users');
    } else {
        // 생성 실패 시
        req.flash('error', '사용자 추가에 실패했습니다. 다시 시도해 주세요.');
        req.flash('enteredData', { name, email, phone });
        res.redirect('/admin/users/add');
    }
});
// ======================================
// 게시물 삭제 (Post Delete)
// ======================================
/**
 * DELETE /admin/posts/:id - 특정 게시물 삭제 처리
 */
exports.deletePost = asyncHandler(async (req, res, next) => {
    try {
        const postId = req.params.id;
        
        const post = await Post.findById(postId);
        
        if (!post) {
            req.flash('error', '삭제할 게시물을 찾을 수 없습니다.');
            return res.redirect('/admin/posts');
        }

        await Post.findByIdAndDelete(postId);
        
        req.flash('success', '게시물이 성공적으로 삭제되었습니다.');
        res.redirect('/admin/posts');
        
    } catch (err) {
        console.error("Error deleting post:", err);
        req.flash('error', '게시물 삭제 중 오류가 발생했습니다.');
        next(err);
    }
});

// ======================================
// Admin Login (관리자 로그인 처리) - POST /admin
// ======================================

exports.loginAdmin = async (req, res, next) => {
    try {
        const { username, password } = req.body; 

        if (!username || !password) {
            req.flash('error', '이메일과 비밀번호를 모두 입력해주세요.');
            return res.redirect('/login'); // /login 페이지로 이동
        }


        const user = await User.findOne({ email: username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash('error', '이메일 또는 비밀번호가 일치하지 않습니다.');
            return res.redirect('/login');
        }

        const token = jwt.sign(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie('token', token, { 
            httpOnly: true, 
            maxAge: 3600000 
        });

        // 5. 관리자
        req.flash('success', `${user.name}님, 로그인했습니다.`);
        res.redirect('/admin'); 

    } catch (err) {
        console.error("Admin login error:", err);
        req.flash('error', '로그인 중 오류가 발생했습니다.');
        res.redirect('/login');
    }
};

/**
 * GET /admin/likes - 모든 좋아요 목록을 렌더링
 */
exports.getAllLikes = async (req, res, next) => {
    try {
        const likes = await Like.find()
            .populate('userId', 'name') 
            .populate('psPostId', 'postText') 
            .sort({ createdAt: -1 });

        res.render('adminLikesList', { 
            likes: likes,
            path: '/admin/likes'
        });

    } catch (err) {
        console.error("Error fetching all likes for admin:", err);
        next(err);
    }
};

/**
 * DELETE /admin/likes/:id - 특정 좋아요 삭제 처리
 */
exports.deleteLike = async (req, res, next) => {
    try {
        const likeId = req.params.id;

        const deletedLike = await Like.findByIdAndDelete(likeId);

        if (!deletedLike) {
            req.flash('error', '좋아요 기록을 찾을 수 없거나 삭제에 실패했습니다.');
            return res.redirect('/admin/likes');
        }

        req.flash('success', '좋아요 기록이 성공적으로 삭제되었습니다.');
        res.redirect('/admin/likes');

    } catch (err) {
        console.error("Error deleting like:", err);
        req.flash('error', '좋아요 기록 삭제 중 오류가 발생했습니다.');
        next(err);
    }
};

// ======================================
// P.S. 게시물 관리 (PsPost Management)
// ======================================

/**
 * GET /admin/ps-posts/:id - 특정 P.S. 게시물 수정 페이지 
 */
exports.getEditPsPostPage = asyncHandler(async (req, res, next) => {
    try {
        const postId = req.params.id;
        
        const post = await PsPost.findById(postId).populate('userId', 'name');

        if (!post) {
            req.flash('error', '게시물을 찾을 수 없습니다.');
            return res.redirect('/admin/ps-posts');
        }

        res.render('adminEditPsPost', {
            post: post,
            path: '/admin/ps-posts',
            enteredData: req.flash('enteredData')[0], 
            errorMessage: req.flash('error')[0]
        });

    } catch (err) {
        console.error("Error fetching edit PsPost page:", err);
        next(err);
    }
});

/**
 * PUT /admin/ps-posts/:id - P.S. 게시물 수정 처리
 */
exports.updatePsPost = asyncHandler(async (req, res, next) => {
    const postId = req.params.id;
    const { postText } = req.body;

    if (!postText || postText.trim().length === 0) {
        req.flash('error', '게시물 내용을 입력해주세요.');
        req.flash('enteredData', { postText });
        return res.redirect(`/admin/ps-posts/${postId}`);
    }

    try {
        const updatedPost = await PsPost.findByIdAndUpdate(
            postId,
            { postText: postText },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            req.flash('error', '게시물을 찾을 수 없거나 수정에 실패했습니다.');
            return res.redirect('/admin/ps-posts');
        }

        req.flash('success', 'P.S. 게시물이 성공적으로 수정되었습니다.');
        res.redirect('/admin/ps-posts'); 
    } catch (err) {
        console.error("Error updating PsPost:", err);
        req.flash('error', '게시물 수정 중 오류가 발생했습니다.');
        req.flash('enteredData', { postText });
        res.redirect(`/admin/ps-posts/${postId}`);
    }
});


exports.getAllPsPosts = async (req, res, next) => {
    try {
        const psPosts = await PsPost.find()
            .populate('userId', 'name') 
            .sort({ createdAt: -1 });

        res.render('adminPsPostsList', { 
            psPosts: psPosts,
            path: '/admin/ps-posts'
        });

    } catch (err) {
        console.error("Error fetching all PsPosts for admin:", err);
        next(err); 
    }
};

/**
 * DELETE /admin/ps-posts/:id -  P.S. 게시물 삭제 처리 
 */
exports.deletePsPost = asyncHandler(async (req, res, next) => {
    try {
        const psPostId = req.params.id;

        const deletedPost = await PsPost.findByIdAndDelete(psPostId);

        if (!deletedPost) {
            req.flash('error', '삭제할 P.S. 게시물을 찾을 수 없습니다.');
        } else {
            const imagePath = deletedPost.imagePath.startsWith('/uploads/')
                ? deletedPost.imagePath.substring('/uploads/'.length)
                : null;
        
            if (imagePath) {
                const fullPath = `./public/uploads/${imagePath}`;
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log(`P.S. 게시물 이미지 삭제 완료: ${fullPath}`);
                } else {
                    console.log(`경고: P.S. 게시물 이미지를 찾을 수 없습니다: ${fullPath}`);
                }
            }


            req.flash('success', 'P.S. 게시물이 성공적으로 삭제되었습니다.');
        }
        res.redirect('/admin/ps-posts'); 
        
    } catch (err) {
        console.error("Error deleting PsPost:", err);
        next(err);
    }
});

