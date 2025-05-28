import { Router } from 'express';
import { getAllDepartments, deleteDepartment, createDepartment, updateDepartment } from '../controllers/departments.controller.js';
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();
//router.use(verifyJwt);

router
    .route('/')
    .get(getAllDepartments)
    .post(createDepartment);

router
    .route('/:departmentId')
    .delete(deleteDepartment)
    .patch(updateDepartment);

export default router;