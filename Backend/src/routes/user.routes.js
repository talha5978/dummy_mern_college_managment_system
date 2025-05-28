import { Router } from 'express';
import {
    addStudent,
    addNewAdmin,
    addTeacher,
    getAllTeachers,
    getAllAdmins,
    getAllStudents,
    loginStudent,
    loginTeacher,
    logoutUser,
    getCurrentUser,
    getStudent, 
    updateUserPassword,
    updateStdDetails,
    updateStdFee,
    updateTeacherDetails,
    getTeacher,
    updateTeacherSalaryDetails,
    loginAdmin,
    updateAdminDetails,
    addNewStaffMember,
    updateStaffMemeberDetails,
    getAllStaffMembers,
    loginStaffMember,
    removeAdmin,
    getBulkSampleStudents,
    addStudentsInBulk,
    deleteStudent
} from "../controllers/user.controller.js"
import verifyJwt from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/authenticator.middleware.js";
import { roles } from "../constants.js";
import upload from '../middlewares/multer.middleware.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import moment from 'moment';
import { decryptPassword, encryptPassword } from '../utils/helpers.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { getStudentsStats } from '../controllers/stats.controller.js';

const router = Router();

router.route('/logout').post(verifyJwt, logoutUser);
router.route('/current-user').get(verifyJwt, getCurrentUser);
router.route('/login-admin').post(loginAdmin);
router.route('/login-staff').post(loginStaffMember);
router.route('/login-teacher').post(loginTeacher);
router.route('/login-student').post(loginStudent);

router.route("/stats/students").get(getStudentsStats);

router
    .route('/student')
    .post(verifyJwt, authorizeRoles(roles.admin, roles.staff), addStudent)
    .get(verifyJwt, authorizeRoles(roles.admin, roles.staff), getAllStudents) // for admins!


//route for admins to get the full details of a student
router
    .route('/student-single/:studentId') 
    .get(verifyJwt, authorizeRoles(roles.admin, roles.staff), getStudent) 

router
    .route('/student/:studentId') 
    .patch(authorizeRoles(roles.admin, roles.staff), updateStdDetails); // to update std basic info!

router
    .route('/student/:studentId/fee')
    .patch(authorizeRoles(roles.admin, roles.staff), updateStdFee);

router
    .route('/bulk/sample')
    .get(authorizeRoles(roles.admin, roles.staff), getBulkSampleStudents);

router
    .route('/bulk/create')
    .post(
        authorizeRoles(roles.admin, roles.staff),
        upload.single('studentsData'),
        addStudentsInBulk
    );

router
    .route('/admin')
    .post(verifyJwt, authorizeRoles(roles.admin), addNewAdmin)
    .get(verifyJwt, authorizeRoles(roles.admin), getAllAdmins);

router
    .route('/admin/:adminId')
    .patch(verifyJwt, authorizeRoles(roles.admin), updateAdminDetails)
    .delete(verifyJwt, authorizeRoles(roles.admin), removeAdmin);

router
    .route('/teacher')
    .post(verifyJwt, authorizeRoles(roles.admin), addTeacher)
    .get(verifyJwt, authorizeRoles(roles.admin), getAllTeachers);

router
    .route('/teacher/:teacherId')
    .get(verifyJwt, authorizeRoles(roles.admin), getTeacher)
    .patch(verifyJwt, authorizeRoles(roles.admin), updateTeacherDetails);

router
    .route('/teacher/:teacherId/salary')
    .patch(authorizeRoles(roles.admin), updateTeacherSalaryDetails);

router
    .route("/update-password/:userId")
    .post(authorizeRoles(roles.superAdmin), updateUserPassword);

router
    .route("/staff")
    .get(getAllStaffMembers)
    .post(verifyJwt, authorizeRoles(roles.admin), addNewStaffMember);

router
    .route("/staff/:staffId")
    .patch(verifyJwt, authorizeRoles(roles.admin), updateStaffMemeberDetails);

export default router;

/*
      const delAll =  (asyncHandler(async (req, res) => {
        await User.deleteMany({
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)), // start of today
              $lte: new Date(new Date().setHours(23, 59, 59, 999)) // end of today
            }
        });
    
        return res
            .status(200)
            .json(new ApiResponse(200, "All students deleted successfully"));
    }));
    
    router.route("/del-all-std").delete(delAll)
     */
    const encrypt = asyncHandler(async (req, res) => {
		const { password } = req.body;
		const s = encryptPassword(password);
		return res.status(200).json(new ApiResponse(200, "Password encrypted successfully", s));
	});
    router.route("/encrypt").post(encrypt);

    const decrypt = asyncHandler(async (req, res) => {
		const { password } = req.body;
		const s = decryptPassword(password);
		return res.status(200).json(new ApiResponse(200, "Password decrypted successfully", s));
	});
    router.route("/decrypt").post(decrypt);
   


// 💀⚡💀⚡💀⚡💀⚡💀⚡💀⚡💀⚡

router.route("/del-std/:studentId").delete(deleteStudent);