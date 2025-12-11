const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs"); 
const User = require('../models/userModel');
const PsPost = require("../models/psPostModel");
const Like = require("../models/likeModel");
const jwt = require("jsonwebtoken");


// @desc    사용자 등록 (회원가입)
// @route   POST /signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword) {
        const errorMessage = "모든 필드(이름, 전화번호, 이메일, 비밀번호)는 필수입니다.";
        return res.render('signup', {
            errorMessage,
            enteredData: { name, email, phone }
        });
    }

    if (password !== confirmPassword) {
        const errorMessage = "비밀번호가 일치하지 않습니다.";
        return res.render('signup', {
            errorMessage,
            enteredData: { name, email, phone }
        });
    }

    const userAvailable = await User.findOne({ email });
    if (userAvailable) {
        const errorMessage = "이미 등록된 이메일입니다.";
        return res.render('signup', {
            errorMessage,
            enteredData: { name, email, phone }
        });
    }
    
    //비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
    });

    if (user) {
        console.log(`사용자 등록 성공: ${user.email}`);
        return res.redirect("/login?success=signup");

    } else {
        const errorMessage = "사용자 등록에 실패했습니다. 다시 시도해 주세요.";
        return res.render('signup', {
            errorMessage,
            enteredData: { name, email, phone }
        });
    }
});
// ---------------------------------------------------------------------

// @desc 사용자 로그인
// @route POST /login
// @access Public
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin';
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET; 

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', {
            errorMessage: "이메일 또는 비밀번호를 입력해 주세요.",
            enteredData: { email }
        });
    }

    const user = await User.findOne({ email });

    // 사용자 존재 및 비밀번호 일치 확인
    if (!user || !(await bcrypt.compare(password, user.password))) {
        const errorMessage = "이메일 또는 비밀번호가 일치하지 않습니다. 다시 입력해 주세요.";
        return res.render('login', { errorMessage, enteredData: { email } });
    }

    //JWT 토큰 생성 및 쿠키 설정
    const accessToken = jwt.sign(
        {
            user: {
                name: user.name,
                email: user.email,
                id: user._id, 
                role: user.role || (user.email === ADMIN_EMAIL ? 'admin' : 'user') 
            },
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" } // 1시간
    );

    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000 // 1시간
    });

    // 관리자 확인
    const userRole = user.role || (user.email === ADMIN_EMAIL ? 'admin' : 'user');

    if (userRole === 'admin') {
        req.flash('success', '관리자로 로그인되었습니다. 대시보드로 이동합니다.');
        return res.redirect('/admin'); // 관리자
    }

    // 일반 사용자
    req.flash('success', `${user.name}님 환영합니다.`);
    res.redirect('/'); 
});

// @desc    로그인된 사용자 정보 조회
// @route   GET /my
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
        req.flash('error', '로그인이 필요합니다.');
        return res.redirect('/login');
    }
    
    const user = await User.findById(req.user.id).select('-password'); 
    
    if (!user) {
        req.flash('error', '사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.');
        res.clearCookie('token'); 
        return res.redirect('/login');
    }
    
    res.render('my', { 
        title: 'My Profile',
        user: user, 
        enteredData: req.flash('enteredData')[0] || {}, 
        errorMessage: req.flash('error')[0],
        successMessage: req.flash('success')[0]
    });
});

// @desc    로그인된 사용자 정보 수정 처리
// @route   PUT /my
// @access  Private
const updateMyProfile = asyncHandler(async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;
    const userId = req.user.id; 

    if (!name || !email || !phone) {
        req.flash('error', '이름, 이메일, 전화번호는 필수입니다.');
        req.flash('enteredData', req.body);
        return res.redirect('/my');
    }

    if (password && password !== confirmPassword) {
        req.flash('error', '새 비밀번호가 일치하지 않습니다.');
        req.flash('enteredData', req.body);
        return res.redirect('/my');
    }

    const updateData = { name, email, phone };

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10); 
        updateData.password = hashedPassword;
    }
    
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { 
        new: true, 
        runValidators: true 
    });

    if (!updatedUser) {
        req.flash('error', '사용자 정보 수정에 실패했습니다.');
        return res.redirect('/my');
    }

    req.flash('success', '정보가 성공적으로 수정되었습니다.');
    res.redirect('/my');
});


// @desc    사용자 계정 삭제 (탈퇴)
// @route   DELETE /my
// @access  Private
const deleteMyAccount = asyncHandler(async (req, res) => {

    if (!req.user || !req.user.id) {
        res.status(401);
        throw new Error("인증되지 않은 사용자입니다. (req.user 누락)");
    }

    const userId = req.user.id;

    const likesResult = await Like.deleteMany({ userId: userId });
    console.log(`좋아요 기록 삭제 결과: ${likesResult.deletedCount}개 삭제됨.`);

    const postsResult = await PsPost.deleteMany({ userId: userId });
    console.log(`게시물 삭제 결과: ${postsResult.deletedCount}개 삭제됨.`);

    const userResult = await User.findByIdAndDelete(userId);

    if (userResult) {
        console.log("사용자 삭제 성공:", userResult.email);

        res.clearCookie('token');

        const logoutScript = `
            <script>
                alert('계정 및 모든 게시물이 성공적으로 삭제되었습니다.');
                window.location.href = '/login';
            </script>
        `;
        return res.status(200).send(logoutScript);
    } else {
        res.status(404);
        throw new Error("사용자 삭제 실패: 해당 ID의 사용자를 찾을 수 없습니다.");
    }
});


const logoutUser = (req, res) => {
    res.clearCookie('token');
    
    console.log("User logged out.");
    res.redirect("/login");
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMyProfile,
    updateMyProfile,
    deleteMyAccount,
};