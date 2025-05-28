import { ApiError } from "./apiError.js";
import { MAX_REQUESTS, LIMITING_TIME } from "../constants.js";
import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
    max: MAX_REQUESTS,
    windowMs: LIMITING_TIME,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
      return req.clientIp;
    },
    handler: (_, __, ___, options) => {
      throw new ApiError(
        options.statusCode || 500,
        `There are too many requests. You are only allowed ${
          options.max
        } requests per ${options.windowMs / 60000} minutes`
      );
    },
});