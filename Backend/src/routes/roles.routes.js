import { Router } from 'express';
import { getAllRoles, deleteRole, createRole, updateRole } from "../controllers/roles.controller.js"
import verifyJwt from "../middlewares/auth.middleware.js";
import { roles } from '../constants.js';
import authroizeRoles from '../middlewares/authenticator.middleware.js';

const router = Router();
//router.use(verifyJwt);

router
    .route('/')
    .get(getAllRoles)
    .post(createRole);

router
    .route('/:roleId')
    .delete(authroizeRoles(roles.superAdmin), deleteRole)
    .patch(authroizeRoles(roles.superAdmin), updateRole);

export default router;