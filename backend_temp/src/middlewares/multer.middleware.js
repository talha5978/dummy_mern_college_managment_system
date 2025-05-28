import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}_${file.originalname}`);
    },
});


const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Fiels with .xlsx extension are allowed only'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

export default upload;