const express = require('express');
const router = express.Router();
const { validateToken } = require("../middleware/validateTokenHandler");
const { 
    registerUser, 
    loginUser, 
    getMyProfile, 
    updateMyProfile, 
    deleteMyAccount 
} = require('../controllers/userController');


// --- 공개 라우트 (인증 필요 없음, 뷰 렌더링) ---
router.get("/login", (req, res) => {
    res.render("login", { errorMessage: null }); 
});
router.get("/signup", (req, res) => {
    res.render("signup", { errorMessage: null, enteredData: {} });
});

// --- 공개 라우트 (POST 요청) ---
router.post("/signup", registerUser);
router.post("/login", loginUser);


// --- 공개 라우트 (로그아웃 처리) ---
// 로그아웃은 토큰을 지우고 로그인 페이지로 이동하는 것이므로 Public으로 유지해야 합니다.
const logoutUser = (req, res) => {
    res.clearCookie('token'); 
    res.redirect("/login"); 
};
router.get("/logout", logoutUser);


router.use(validateToken); 

router.get("/my", getMyProfile); 
router.put("/my", updateMyProfile);
router.delete("/my", deleteMyAccount); 

module.exports = router;