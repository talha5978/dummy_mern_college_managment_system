import { Router } from 'express';
import { getAllClasses, deleteClass, createClass, updateClass, getClassById } from "../controllers/classes.controller.js"
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();
//router.use(verifyJwt);

router
    .route('/')
    .get(getAllClasses)
    .post(createClass);

router
    .route('/:classId')
    .get(getClassById);

router
    .route('/:classId')
    .delete(deleteClass)
    .patch(updateClass);

export default router;