// config/uploadConfig.js (수정 완료)

const multer = require('multer');
const path = require('path'); 
const cloudinary = require('cloudinary').v2; 
const { CloudinaryStorage } = require('multer-storage-cloudinary');



const storage = new CloudinaryStorage({
    cloudinary: cloudinary, // server.js에서 설정된 객체를 사용
    params: {
        folder: '1PS_uploads', 
        format: async (req, file) => 'jpeg', 
        public_id: (req, file) => 'imageFile-' + Date.now() + '-' + Math.round(Math.random() * 1E9), 
    },
});

const upload = multer({
    storage: storage, 
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("이미지 파일 (jpeg/jpg/png/gif)만 허용됩니다."));
    }
});

const uploadSingleImage = upload.single('imageFile');

module.exports = { uploadSingleImage };