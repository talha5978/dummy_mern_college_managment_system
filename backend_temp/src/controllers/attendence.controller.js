import { Types } from "mongoose";
import moment from "moment";
import { TimeTabels } from "../models/timetables.model.js";
import { Attendence } from "../models/attendence.model.js";
import { Student } from "../models/student.model.js";
import { Teacher } from "../models/teacher.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { validateRequiredFields } from "../utils/validations.js";
import { cacheService as cache } from "../utils/cacheService.js";
// TEACHER MARKING --- START
const get_Sections_Lectures  = asyncHandler(async (req, res) => {
    const teacherId = req?.user?._id;
    if(!Types.ObjectId.isValid(teacherId)) throw new ApiError(400, "Invalid teacher id provided");
    // AJ K DIN MIEN CURRENT LOGGED IN TEACHER K LECTURES!
    
    const sections = await TimeTabels.aggregate([
        {
            $match: {
                teacher: new Types.ObjectId(teacherId),
                day: moment().format("dddd")  // today!
            }
        },
        {
            $lookup: {
                from: "sections",
                localField: "section",
                foreignField: "_id",
                as: "section",
                pipeline: [
                    { $project: { name: 1, _id: 1 } }
                ]
            }
        },
        { $project: { _id: 0 } },
        { $unwind: "$section" },
        { $sort: { "timeslot.start": 1 } },
        {
            $project: { 
                section: {
                    _id: "$section._id",
                    name: "$section.name"
                },
                subject: 1,
            }
        }
    ]);
    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            `${sections.length > 0 ? "Lectures fetched successfully" : "No lectures found for today"}`, 
            sections
        ));
});

const getStudentsForAttendence = asyncHandler(async (req, res) => {
    const { sectionId } = req?.params;

    validateRequiredFields(req?.params, ["sectionId"]);
    if (!Types.ObjectId.isValid(sectionId)) throw new ApiError(400, "Invalid section id");

    const todayStart = moment().startOf("day").toDate(); // Start of today
    const todayEnd = moment().endOf("day").toDate();   // End of today

    const allStudents = await Student.aggregate([
        {
            $match: {
                sectionId: new Types.ObjectId(sectionId)
            }
        },
        { $limit: 200 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    { $project: { fullName: 1, _id: 1 } }
                ]
            }
        },
        { $unwind: "$userDetails" },
        { $addFields: { fullName: "$userDetails.fullName" } },
        {
            $project: {
                _id: 1,
                fullName: 1,
                rollNumber: 1
            }
        }
    ]);
    
    if (allStudents.length === 0) {
        throw new ApiError(404, "No students found");
    }

    const todaysAttendance = await Attendence.aggregate([
		{
			$match: {
				role: "student",
				date: { $gte: todayStart, $lte: todayEnd },
			},
		},
		{ $limit: 100 },
		{
			$project: {
				userId: 1,
				status: 1, // Attendance status (P, A, L, H)
				date: 1,
			},
		},
	]);

    const attendanceMap = new Map(
        todaysAttendance.map(record => [record.userId.toString(), record.status])
    );
    
    const DEFAULT_ATTENDANCE_STATUS = "A";

    const studentsAttendanceData = allStudents.map(student => ({
        _id: student._id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        attendanceStatus: attendanceMap.get(student._id.toString()) || DEFAULT_ATTENDANCE_STATUS,
        date: todayStart
    }));

    return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				"Today's students fetched successfully for attendance marking",
				studentsAttendanceData
			)
		);
});

const markStudentsAttd = asyncHandler(async (req, res) => {
    const { attendenceData, sectionId, subject } = req?.body; 
    // attendenceData: Arrray of { studentId, status }, subject: ye lecture hai jo store ho rha hai
    console.log("attendenceData", attendenceData);
    
    validateRequiredFields(req?.body, ["attendenceData", "sectionId", "subject"]);

    if (!Types.ObjectId.isValid(sectionId)) throw new ApiError(400, "Invalid section id");
    if (attendenceData.length === 0) throw new ApiError(400, "Attendence data is required and must be an array");

    attendenceData.forEach(({ studentId, status }) => {
        if (!Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid student id");
        if (!["P", "A", "L", "H"].includes(status)) {
            throw new ApiError(400, "Status must be either P, A, L or H for every student");
        }
    });

    const today = moment().startOf('day').toDate();

    const bulk_Writing = attendenceData.map(({ studentId, status }) => ({
        updateOne: {
            filter: {
                userId: new Types.ObjectId(studentId),
                role: "student",
                section: new Types.ObjectId(sectionId),
                lecture: subject.trim(),
                date: today
            },
            update: {
                $set: { status }
            },
            upsert: true
        }
    }));

    const process = await Attendence.bulkWrite(bulk_Writing);

    if(!process) throw new ApiError(500, "Something went wrong while updating attendence");

    return res
        .status(200)
        .json(new ApiResponse(200, "Attendence marked successfully for students"));
});
// STUDENT MARKING --- END

const getTodaysTeachersAttendance = asyncHandler(async (req, res) => {
    // Define today's date range
    const todayStart = moment().startOf("day").toDate(); // Start of today
    const todayEnd = moment().endOf("day").toDate();   // End of today

    // Step 1: Fetch all teachers
    const allTeachers = await Teacher.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [{ $project: { fullName: 1 } }]
            }
        },
        { $limit: 100 },
        { $unwind: "$userDetails" },
        {
            $lookup: {
                from: "departments",
                localField: "departments",
                foreignField: "_id",
                as: "departmentsDetails",
                pipeline: [{ $project: { name: 1 } }]
            }
        },
        {
            $project: {
                _id: "$_id",
                fullName: "$userDetails.fullName",
                departments: "$departmentsDetails.name",
                subjectSpecialization: 1,
                status: "$status" // Teacher's academic status, not attendance
            }
        }
    ]);

    if (!allTeachers.length) {
        throw new ApiError(404, "No teachers found");
    }

    // Step 2: Fetch today's attendance records
    const todaysAttendance = await Attendence.aggregate([
		{
			$match: {
				role: "teacher",
				date: { $gte: todayStart, $lte: todayEnd },
			},
		},
		{ $limit: 100 },
		{
			$project: {
				userId: 1,
				status: 1, // Attendance status (P, A, L, H)
				date: 1,
			},
		},
	]);

    // Step 3: Map attendance to teachers, defaulting to "A" if no record exists
    const attendanceMap = new Map(
        todaysAttendance.map(record => [record.userId.toString(), record.status])
    );

    const DEFAULT_ATTENDANCE_STATUS = "A";

    const teacherAttendanceData = allTeachers.map(teacher => ({
        _id: teacher._id,
        fullName: teacher.fullName,
        departments: teacher.departments,
        subjectSpecialization: teacher.subjectSpecialization,
        status: teacher.status,
        attendanceStatus: attendanceMap.get(teacher._id.toString()) || DEFAULT_ATTENDANCE_STATUS,
        date: todayStart
    }));

    // Step 4: Return the response
    return res.status(200).json(
        new ApiResponse(200, "Today's teacher attendance fetched successfully", teacherAttendanceData)
    );
});

const markTeachersAttd = asyncHandler(async (req, res) => {
    const { attendenceData } = req?.body;
    console.log("attendenceData", attendenceData);
    
    validateRequiredFields(req?.body, ["attendenceData"]);

    if (attendenceData.length === 0) {
        throw new ApiError(400, "Attendence data is required and must be an array");
    }

    attendenceData.forEach(({ teacherId, status }) => {
        if (!Types.ObjectId.isValid(teacherId)) throw new ApiError(400, "Invalid teacher id");
        if (!["P", "A", "L", "H"].includes(status)) {
            throw new ApiError(400, "Status must be either P, A, L or H for every teacher");
        }
    });

    const today = moment().startOf('day').toDate();

    const bulk_Writing = attendenceData.map(({ teacherId, status }) => ({
        updateOne: {
            filter: {
                userId: new Types.ObjectId(teacherId),
                role: "teacher",
                date: today
            },
            update: {
                $set: { status }
            },
            upsert: true
        }
    }));

    const process = await Attendence.bulkWrite(bulk_Writing);

    if(!process) throw new ApiError(500, "Something went wrong while updating attendence");

    return res
        .status(200)
        .json(new ApiResponse(200, "Attendence marked successfully for teachers"));
});

const getStudentAttendence = asyncHandler(async (req, res) => {
    const { studentId } = req?.params;
    validateRequiredFields(req?.params, ["studentId"]);

    if (cache.has(`student-${studentId}`)) {
        const cachedStd = cache.get(`student-${studentId}`);
        console.log("Single Student Cache Hit 😘");
        if (cachedStd) {
            return res
                .status(200)
                .json(new ApiResponse(200, "Student Attendence fetched successfully", cachedStd));
        }
        
    }

    const attendenceData = await Attendence.find({
        userId: new Types.ObjectId(studentId),
        role: "student"
    }).sort({ date: 1 });

    if (attendenceData.length === 0) throw new ApiError(404, "No attendence found");

    let attendanceSummary = {};
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0, totalHolidays = 0, totalLectures = 0;
    let monthlyPercentage = {};

    attendenceData.forEach((record) => {
        const monthYear = new Date(record.date).toLocaleString("en-US", {
            month: "long",
            year: "numeric"
        });

        if (!attendanceSummary[monthYear]) {
            attendanceSummary[monthYear] = {};
            monthlyPercentage[monthYear] = { present: 0, total: 0 };
        }

        const day = record.date.toISOString().split("T")[0]; // YYYY-MM-DD format

        if (!attendanceSummary[monthYear][day]) {
            attendanceSummary[monthYear][day] = [];
        }

        // Update total lecture count only if P or A not when leave or holiday!
        if (record.status === "P" || record.status === "A") {
            totalLectures++;
            monthlyPercentage[monthYear].total++;
        }

        // Update count metrics
        if (record.status === "P") {
            totalPresent++;
            monthlyPercentage[monthYear].present++;
        }
        if (record.status === "A") totalAbsent++;
        if (record.status === "L") totalLeave++;
        if (record.status === "H") totalHolidays++;

        attendanceSummary[monthYear][day].push({
            lecture: record.lecture,
            status: record.status
        });
    });

    const overallAttendancePercentage = totalLectures > 0 ? ( (totalPresent / totalLectures) * 100 ).toFixed(2) : 0;
    // INDIVIDUAL MONTH PERCENTAGE CALCULATION
    for (let month in monthlyPercentage) {
        monthlyPercentage[month] = monthlyPercentage[month].total > 0
            ? Number((( monthlyPercentage[month].present / monthlyPercentage[month].total ) * 100).toFixed(2))
            : 0;
    }

    cache.set(`student-${studentId}`, {
        totalPresent,
        totalAbsent,
        totalLeave,
        totalHolidays,
        overallAttendancePercentage: Number(overallAttendancePercentage),
        monthlyAttendancePercentage: monthlyPercentage,
        data: attendanceSummary
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, `Attendence for student ${studentId} fetched successfully`, {
                totalPresent,
                totalAbsent,
                totalLeave,
                totalHolidays,
                overallAttendancePercentage: Number(overallAttendancePercentage),                monthlyAttendancePercentage: monthlyPercentage,
                data: attendanceSummary
            })
        )
});

const getTeacherAttendence = asyncHandler(async (req, res) => {
    const { teacherId } = req?.params;
    validateRequiredFields(req?.params, ["teacherId"]);

    const attendenceData = await Attendence.find({
        userId: new Types.ObjectId(teacherId),
        role: "teacher"
    }).sort({ date: 1 });

    if (attendenceData.length === 0) throw new ApiError(404, "No attendence found");

    let attendanceSummary = {};
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0, totalHolidays = 0, totalLectures = 0;
    let monthlyPercentage = {};

    attendenceData.forEach((record) => {
        const monthYear = new Date(record.date).toLocaleString("en-US", {
            month: "long",
            year: "numeric"
        });

        if (!attendanceSummary[monthYear]) {
            attendanceSummary[monthYear] = {};
            monthlyPercentage[monthYear] = { present: 0, total: 0 };
        }

        const day = record.date.toISOString().split("T")[0]; // YYYY-MM-DD format

        if (!attendanceSummary[monthYear][day]) {
            attendanceSummary[monthYear][day] = "";
        }

        // Update total lecture count only if P or A not when leave or holiday!
        if (record.status === "P" || record.status === "A") {
            totalLectures++;
            monthlyPercentage[monthYear].total++;
        }

        // Update count metrics
        if (record.status === "P") {
            totalPresent++;
            monthlyPercentage[monthYear].present++;
        }
        if (record.status === "A") totalAbsent++;
        if (record.status === "L") totalLeave++;
        if (record.status === "H") totalHolidays++;

        attendanceSummary[monthYear][day] = record.status;
    });
    console.log(monthlyPercentage)
    const overallAttendancePercentage = totalLectures > 0 ? ( (totalPresent / totalLectures) * 100 ).toFixed(2) : 0;
    for (let month in monthlyPercentage) {
        monthlyPercentage[month] = monthlyPercentage[month].total > 0
            ? Number((( monthlyPercentage[month].present / monthlyPercentage[month].total ) * 100).toFixed(2))
            : 0;
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Attendence fetched successfully", {
                totalPresent,
                totalAbsent,
                totalLeave,
                totalHolidays,
                overallAttendancePercentage: Number(overallAttendancePercentage),
                monthlyAttendancePercentage: monthlyPercentage,         
                data: attendanceSummary
            })
        )
});

const getAllStudentsAttendence = asyncHandler(async (req, res) => {
    const { sectionId } = req?.params;
    validateRequiredFields(req?.params, ["sectionId"]);
    
    const { limit = 20, page = 1 } = req?.query;
    
    const attendencePipeline = [
        {
            $match: {
                section: new Types.ObjectId(sectionId),
                role: "student"
            }
        },
        { $sort: { date: 1 } },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    { $project: { fullName: 1 } }
                ]
            }
        },
        { $unwind: "$userDetails" },
        {
            $lookup: {
                from: "students",
                localField: "userId",
                foreignField: "_id",
                as: "studentDetails",
                pipeline: [
                    { $project: { rollNumber: 1, status: 1 } }
                ]
            }
        },
        { $unwind: "$studentDetails" },
        { $addFields: {
            rollNumber: "$studentDetails.rollNumber",
            academicStatus: "$studentDetails.status",
            fullName: "$userDetails.fullName"
        }},
        {
            $project: {
                userId: 1,
                rollNumber: 1,
                fullName: 1,
                academicStatus: 1,
                status: 1,
                date: 1
            }
        }
    ];

    const pipelineResp = await Attendence.aggregatePaginate(Attendence.aggregate(attendencePipeline), {
        page: Number(page),
        limit: Number(limit)
    });

    const attendenceData = pipelineResp.docs;
    
    if (attendenceData.length === 0) {
        return res
            .status(404)
            .json(new ApiResponse(404, "No attendence found"));
    }

    let totalPresent = 0, totalLectures = 0;
    let attendenceSummary = {};

    attendenceData.forEach((record) => {
        if (!attendenceSummary[record.userId]) {
            attendenceSummary[record.userId] = {
                present: 0,
                total: 0,
                rollNumber: record.rollNumber,
                fullName: record.fullName,
                academicStatus: record.academicStatus
            };
        }

        if (record.status === "P" || record.status === "A") {
            attendenceSummary[record.userId].total++;
            totalLectures++;
        }
        if (record.status === "P") {
            attendenceSummary[record.userId].present++;
            totalPresent++;
        }
    });
    
    let studentAttendanceData = [];
    for (const student in attendenceSummary) {
        const studentData = attendenceSummary[student];

        const attendancePercentage = studentData.total > 0 ? Number((( studentData.present / studentData.total ) * 100).toFixed(2)) : 0;

        studentAttendanceData.push({
            _id: student,
            rollNumber: studentData.rollNumber,
            fullName: studentData.fullName,
            status: studentData.academicStatus,
            attendence: attendancePercentage
        });
    }

    const overallAttendancePercentage = totalLectures > 0 ? (( totalPresent / totalLectures ) * 100).toFixed(2) : 0;
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Students attendence fetched successfully", {
            overallAttendancePercentage: Number(overallAttendancePercentage),
            data: studentAttendanceData,
            pagination: {
                ...pipelineResp,
                docs: undefined
            }
        }));
});

const getAllTeachersAttendence = asyncHandler(async (req, res) => {
    const { limit = 20, page = 1 } = req?.query;
    
    const attedancePipeline = [
        {
            $match: { role: "teacher" }
        },
        { $sort: { date: 1 } },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    { $project: { fullName: 1 } }
                ]
            }
        },
        { $unwind: "$userDetails" },
        {
            $lookup: {
                from: "teachers",
                localField: "userId",
                foreignField: "_id",
                as: "teacherDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "departments",
                            localField: "departments",
                            foreignField: "_id",
                            as: "departmentsDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    {
                        $addFields: { departments: "$departmentsDetails.name" }
                    },
                    { $project: { departments: 1, status: 1, subjectSpecialization: 1 } }
                ]
            }
        },
        { $unwind: "$teacherDetails" },
        { $addFields: {
            departments: "$teacherDetails.departments",
            subjectSpecialization: "$teacherDetails.subjectSpecialization",
            academicStatus: "$teacherDetails.status",
            fullName: "$userDetails.fullName"
        }},
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
        {
            $project: {
                userId: 1,
                departments: 1,
                subjectSpecialization: 1,
                fullName: 1,
                academicStatus: 1,
                status: 1,
                date: 1
            }
        }
    ];
    
    const pipelineResp = await Attendence.aggregatePaginate(Attendence.aggregate(attedancePipeline), {
        page: Number(page),
        limit: Number(limit)
    });

    const attendenceData = pipelineResp.docs;
    
    if (attendenceData.length === 0) throw new ApiError(404, "No attendence found");

    let totalPresent = 0, totalLectures = 0;
    let attendenceSummary = {};

    attendenceData.forEach((record) => {
        if (!attendenceSummary[record.userId]) {
            attendenceSummary[record.userId] = {
                present: 0,
                total: 0,
                departments: record.departments,
                fullName: record.fullName,
                academicStatus: record.academicStatus,
                subjectSpecialization: record.subjectSpecialization
            };
        }

        if (record.status === "P" || record.status === "A") {
            attendenceSummary[record.userId].total++;
            totalLectures++;
        }
        
        if (record.status === "P") {
            attendenceSummary[record.userId].present++;
            totalPresent++;
        }
    });
    
    let teacherAttendanceData = [];
    for (const teacher in attendenceSummary) {
        const teacherData = attendenceSummary[teacher];

        const attendancePercentage = teacherData.total > 0 ? Number((( teacherData.present / teacherData.total ) * 100).toFixed(2)) : 0;

        teacherAttendanceData.push({
            _id: teacher,
            fullName: teacherData.fullName,
            attendence: attendancePercentage,
            departments: teacherData.departments,
            subjectSpecialization: teacherData.subjectSpecialization,
            status: teacherData.academicStatus
        });
    }

    const overallAttendancePercentage = totalLectures > 0 ? (( totalPresent / totalLectures ) * 100).toFixed(2) : 0;
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Teachers attendence fetched successfully", {
            overallAttendancePercentage: Number(overallAttendancePercentage),
            data: teacherAttendanceData,
            pagination: {
                ...pipelineResp,
                docs: undefined
            }
        }));
});


export {
    get_Sections_Lectures,
    getStudentsForAttendence,
    markStudentsAttd,
    markTeachersAttd,
    getStudentAttendence,
    getTeacherAttendence,
    getAllStudentsAttendence,
    getAllTeachersAttendence,
    getTodaysTeachersAttendance
};