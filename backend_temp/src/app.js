import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middleware.js";
import morganMiddleware from "./logger/morgan.logger.js";
import compression from "compression";
import { limiter } from "./utils/rateLimiter.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN?.split(","),
    credentials: true // TODO: credentials: include on the frontend
}));

app.use(limiter);

app.use(compression());
app.use(express.json({ limit: "12kb" }));
app.use(express.urlencoded({ extended: true, limit: "12kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(helmet());

app.use(morganMiddleware);

//routes import
import healthcheckRouter from "./routes/healthcheck.routes.js";
import rolesRouter from "./routes/roles.routes.js";
import classesRouter from "./routes/classes.routes.js";
import sectionsRouter from "./routes/sections.routes.js";
import userRouter from "./routes/user.routes.js";
import departmentsRouter from "./routes/departments.routes.js";
import programsRouter from "./routes/programs.routes.js";
import timetablesRouter from "./routes/timetables.routes.js";
import attendenceRouter from "./routes/attendence.routes.js";
import { User } from "./models/user.model.js";

//routes declaration
app.use("/api/healthcheck", healthcheckRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/classes", classesRouter);
app.use("/api/sections", sectionsRouter);
app.use("/api/user", userRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/programs", programsRouter);
app.use("/api/timetables", timetablesRouter);
app.use("/api/attendence", attendenceRouter);

// test route for login
/*app.get("/", async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    }

    const generateAccess_RefreshToken = async (id) => {
        try {
            const user = await User.findById(id);
            const accessToken = await user.generateAccessToken();
            const refreshToken = await user.generateRefreshToken();

            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });

            return { accessToken, refreshToken };
        } catch (error) {
            throw new ApiError(
                500,
                "Something went wrong while generating access or refresh token"
            );
        }
    };

    const { accessToken, refreshToken } = await generateAccess_RefreshToken(
        "67b96b43878283ed2e090a0a"
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({ accessToken, refreshToken });
});*/

app.use(errorHandler);

export { app };