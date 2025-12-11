const multer = require('multer');
const path = require('path');
// const fs = require('fs');
// const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

// Cloudinary
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: '1PS_uploads', 
        format: async (req, file) => 'jpeg', 
        public_id: (req, file) => 'imageFile-' + Date.now() + '-' + Math.round(Math.random() * 1E9), 
    },
});

// 파일 업로드 인스턴스 (최대 5MB, 이미지 파일만 허용)
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


// if (!fs.existsSync(UPLOAD_DIR)) {
//     fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, UPLOAD_DIR);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });

// 파일 업로드 인스턴스 (최대 5MB, 이미지 파일만 허용)
// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 10 * 1024 * 1024 },
//     fileFilter: (req, file, cb) => {
//         const filetypes = /jpeg|jpg|png|gif/;
//         const mimetype = filetypes.test(file.mimetype);
//         const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//         if (mimetype && extname) {
//             return cb(null, true);
//         }
//         cb(new Error("이미지 파일 (jpeg/jpg/png/gif)만 업로드할 수 있습니다."));
//     }
// });

const uploadSingleImage = upload.single('imageFile');

module.exports = { uploadSingleImage };