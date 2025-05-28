import { ApiError } from "../utils/apiError.js";
import logger from "../logger/winston.logger.js";
import mongoose from "mongoose";
import { unlinkExcelFile } from "../utils/helpers.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    if ( !(error instanceof ApiError) ) {
        const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error.errors || undefined, error.stack);
    }
    
    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    };

    logger.error(`${error.message}`);
    if (process.env.NODE_ENV === "development") console.log(error);
    
    if (req.file) {
        unlinkExcelFile(req.file.path);
    }
    console.log(response);
    
    return res
        .status(error.statusCode)
        .json(response);
};

export { errorHandler };


// TODO: IMPLEMENT MONGOOSE AGGREGATE PAGINATE