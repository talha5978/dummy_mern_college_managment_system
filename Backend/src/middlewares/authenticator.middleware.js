import { ApiError } from "../utils/apiError.js";

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, "You are not allowed to perform this action");
        }
        next();
    };
};

export default authorizeRoles;