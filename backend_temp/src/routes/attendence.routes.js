import { Router } from 'express';
import {
	get_Sections_Lectures,
	getAllStudentsAttendence,
	getAllTeachersAttendence,
	getStudentAttendence,
	getStudentsForAttendence,
	getTeacherAttendence,
	getTodaysTeachersAttendance,
	markStudentsAttd,
	markTeachersAttd,
} from "../controllers/attendence.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
import { roles } from '../constants.js';
import authorizeRoles from '../middlewares/authenticator.middleware.js';

const router = Router();
router.use(verifyJwt);

router
    .route('/sections-for-attendence')
    .get(authorizeRoles(roles.teacher), get_Sections_Lectures) // today lectures !!


// GET ALL STUDENTS FOR A SECTION WHEN TEACHER CLICKS ON A SECTION FOR ATTENDENCE
router
    .route('/students-for-attendence/:sectionId')
    .get(authorizeRoles(roles.teacher), getStudentsForAttendence);

router
    .route('/mark/students')
    .post(authorizeRoles(roles.teacher), markStudentsAttd);

router
    .route('/teachers-attedance-today')
    .get(authorizeRoles(roles.admin, roles.staff), getTodaysTeachersAttendance);

router
    .route('/mark/teachers')
    .post(authorizeRoles(roles.admin), markTeachersAttd);

router
    .route('/all/students/:sectionId')
    .get(authorizeRoles(roles.admin, roles.teacher, roles.staff), getAllStudentsAttendence);

router
    .route('/all/teachers')
    .get(authorizeRoles(roles.admin, roles.staff), getAllTeachersAttendence);

router
    .route('/student/:studentId')
    .get(authorizeRoles(roles.admin, roles.staff, roles.student), getStudentAttendence);

router
    .route('/teacher/:teacherId')
    .get(authorizeRoles(roles.admin, roles.teacher, roles.staff), getTeacherAttendence);


export default router;