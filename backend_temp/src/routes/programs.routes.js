import { Router } from 'express';
import { defineProgram, deleteProgram, getAllPrograms, updateProgram, getProgramById } from "../controllers/programs.controller.js"
import verifyJwt from "../middlewares/auth.middleware.js";
import authorizeRoles from '../middlewares/authenticator.middleware.js';
import { roles } from '../constants.js';

const router = Router();
//router.use(verifyJwt);

router
    .route('/')
    .get(verifyJwt, authorizeRoles(roles.admin), getAllPrograms)
    .post(defineProgram);

router
    .route('/:programId')
    .delete(deleteProgram)
    .get(getProgramById)
    .patch(updateProgram);

export default router;