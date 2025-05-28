import { Router } from 'express';
import {
    createTimetable,
    getTimetable,
    deleteTimetable,
    updateTimetable,
    getAllTimetables,
    createBulkTimetable,
    getBulkSampleTimetable,
    deleteAllTimetables,
} from "../controllers/timetables.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { roles } from '../constants.js';
import authorizeRoles from '../middlewares/authenticator.middleware.js';

const router = Router();
router.use(verifyJwt);

router
    .route('/')
    .post(authorizeRoles(roles.admin), createTimetable)
    .get(authorizeRoles(roles.teacher, roles.student), getTimetable); // For students and teachers

router
    .route('/bulk/sample')
    .get(authorizeRoles(roles.admin), getBulkSampleTimetable);

router
	.route("/bulk/create")
	.post(authorizeRoles(roles.admin), upload.single("timetable"), createBulkTimetable);

router
    .route('/all-timetables')
    .get(authorizeRoles(roles.admin, roles.staff), getAllTimetables)
    .delete(authorizeRoles(roles.admin), deleteAllTimetables); // for admins

router
    .route('/:timetableId')
    .delete(authorizeRoles(roles.admin), deleteTimetable)
    .patch(authorizeRoles(roles.admin), updateTimetable);



export default router;