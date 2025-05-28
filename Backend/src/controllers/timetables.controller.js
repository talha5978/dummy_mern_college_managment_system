import moment from "moment";
import xlsx from "xlsx-js-style";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url'
import fs from "fs";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { TimeTabels } from "../models/timetables.model.js";
import {
    validateRequiredFields,
    checkFieldAvailablity,
    optionallyUpdateFields,
} from "../utils/validations.js";
import { Student } from "../models/student.model.js";
import { unlinkExcelFile, formatExcelTime } from "../utils/helpers.js";
import { xlsxSheetHeaderStyles, xlsxSheetDataStyles, roles } from "../constants.js";
import { cacheService as cache } from "../utils/cacheService.js";

const createTimetable = asyncHandler(async (req, res) => {
    const { teacherId, subject, day, startTime, endTime, sectionId } = req?.body;

    validateRequiredFields(req?.body, [
        "teacherId",
        "subject",
        "day",
        "startTime",
        "endTime",
        "sectionId",
    ]);

    if (!Types.ObjectId.isValid(teacherId)) throw new ApiError(400, "Invalid teacher id");
    if (!Types.ObjectId.isValid(sectionId)) throw new ApiError(400, "Invalid section id");

    const startUTC = moment.utc(startTime, "hh:mm A").format("hh:mm A");
    const endUTC = moment.utc(endTime, "hh:mm A").format("hh:mm A");
    //console.time("conflict");
    const conflict = await TimeTabels.findOne({
        teacher: teacherId,
        day: day.trim(),
        $expr: {
            $and: [
                { $lt: ["$timeslot.start", endUTC] },
                { $gt: ["$timeslot.end", startUTC] },
            ],
        },
    }).select("_id").lean();

    // console.log(conflict);
    // console.timeEnd("conflict");
    if (conflict) {
        throw new ApiError(409, "Teacher is already assigned another lecture at this time.");
    }

    await TimeTabels.create({
        teacher: teacherId,
        subject: subject.trim(),
        day: day.trim(),
        timeslot: {
            start: startUTC,
            end: endUTC,
        },
        section: sectionId,
    });

    cache.del("timetables");

    return res
        .status(201)
        .json(new ApiResponse(201, "Timetable created successfully"));
});

const getBulkSampleTimetable = asyncHandler(async (req, res) => {
    const sampleData = [
        {
            "Teacher Id": "679f1774f4247b94702aebb2",
            "Subject": "Physics",
            "Day": "Monday",
            "Start time": "00:00 AM",
            "End time": "00:00 AM",
            "Section Id": "679f177468fg4294702aef33"
        },
        {
            "Teacher Id": "679f177468fg4294702aedd3",
            "Subject": "Physics",
            "Day": "Tuesday",
            "Start time": "00:00 AM",
            "End time": "00:00 AM",
            "Section Id": "679f177468fg4294702ae0v3"
        },
        {
            "Teacher Id": "679f177468fg4294702aedd3",
            "Subject": "Physics",
            "Day": "Wednesday",
            "Start time": "00:00 AM",
            "End time": "00:00 AM",
            "Section Id": "679f177468fg4294702ae0v3"
        },
        {
            "Teacher Id": "679f177468fg4294702aedd3",
            "Subject": "Physics",
            "Day": "Thursday",
            "Start time": "00:00 AM",
            "End time": "00:00 AM",
            "Section Id": "679f177468fg4294702ae0v3"
        },
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(sampleData);

    const range = xlsx.utils.decode_range(worksheet["!ref"]);

    // Apply styling to headers (first row)
    for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = `${xlsx.utils.encode_col(C)}1`; // Header row is always row 1
        if (worksheet[cellAddress]) {
            worksheet[cellAddress].s = xlsxSheetHeaderStyles; // Apply header style
        }
    }

    // Apply styling to data rows (rows 2 and beyond)
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = `${xlsx.utils.encode_col(C)}${R + 1}`;
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = xlsxSheetDataStyles; // Apply data style
            }
        }
    }
    
    // Set column widths
    worksheet["!cols"] = [
        { wch: 37 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 37 }
    ];

    // Set row heights
    worksheet["!rows"] = [{ hpt: 20 }, { hpt: 18 }];

    xlsx.utils.book_append_sheet(workbook, worksheet, "Sample Timetable");

    // Get __dirname equivalent for ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Define file path using __dirname
    const filePath = join(__dirname, "../public/temp/sample_timetable.xlsx");

    // Ensure the directory exists
    const dir = dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write the workbook to file
    try {
        xlsx.writeFile(workbook, filePath);
    } catch (writeErr) {
        console.error("Error writing Excel file:", writeErr);
        return res.status(500).send("Failed to generate timetable file");
    }

    // Set headers explicitly and send the file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_timetable.xlsx"');

    // Send the file for download
    res.download(filePath, "sample_timetable.xlsx", (downloadErr) => {
        if (downloadErr) {
            console.error("Error downloading file:", downloadErr);
            return res.status(500).send("Error downloading timetable file");
        }

        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file from server:", unlinkErr);
        });
    });
});

const createBulkTimetable = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "No file uploaded");
    
    // The collection should be empty before creating through file batch
    const existingTimetables = await TimeTabels.find({}).select("_id").lean();
    if (existingTimetables.length > 0) throw new ApiError(400, "Timetables already exist");
    
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    // Assuming first sheet (inform frontend to ensure single sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) throw new ApiError(400, "No data found in file");

    // Checking for valid ids of teachers and sections
    jsonData.forEach((timetable) => {
        if(timetable["Teacher Id"] && !Types.ObjectId.isValid(timetable["Teacher Id"].trim())) {
            throw new ApiError(400, "Invalid teacher id");
        }
        if(timetable["Section Id"] && !Types.ObjectId.isValid(timetable["Section Id"].trim())) {
            throw new ApiError(400, "Invalid section id");
        }
    });

    // Process and validate data
    let formattedArr = jsonData.map((timetable) => ({
        teacher: new Types.ObjectId(timetable["Teacher Id"].trim()),
        subject: timetable["Subject"].trim(),
        day: timetable["Day"].trim(),
        timeslot: {
            start: moment.utc(formatExcelTime(timetable["Start time"]).trim(), "hh:mm A").format("hh:mm A"),
            end: moment.utc(formatExcelTime(timetable["End time"]).trim(), "hh:mm A").format("hh:mm A"),
        },
        section: new Types.ObjectId(timetable["Section Id"].trim()),
    }));
    // console.log(formattedArr);
    
    // return

    for (const [ index, timetable ] of formattedArr.entries()) {   
        // Validate required fields
        validateRequiredFields(timetable, ["teacher", "subject", "day", "section"]);
        validateRequiredFields(timetable.timeslot, ["start", "end"]);

        // Validate day
        const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        if (!validDays.includes(timetable.day)) {
            throw new ApiError(400, `Invalid day at index ${index}: ${timetable.day} in the file`);
        }

        const doTimeSlotsOverlap = (slot1, slot2) => {
            return slot1.start < slot2.end && slot2.start < slot1.end;
        };

        // Check for time conflicts..
        for (let i = 0; i < formattedArr.length; i++) {
            for (let j = i + 1; j < formattedArr.length; j++) {
                const t1 = formattedArr[i];
                const t2 = formattedArr[j];
                console.log(t1.timeslot, t2.timeslot);
                console.log("----------------");
                if (t1.teacher.equals(t2.teacher) && t1.day === t2.day && doTimeSlotsOverlap(t1.timeslot, t2.timeslot)) {
                    throw new ApiError(
                        400, `Time Conflict: Teacher ${t1.teacher} has overlapping slots on ${t1.day}: ` +
                        `${t1.timeslot.start} - ${t1.timeslot.end} and ${t2.timeslot.start} - ${t2.timeslot.end}`
                    );
                }
            }
        }
    }
    
    unlinkExcelFile(filePath);
    
    // Insert all valid timetables
    await TimeTabels.insertMany(formattedArr).catch((err) => {
        throw new ApiError(500, "Error occurred while creating timetables: ", err.message);
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Timetables created successfully"));
});

// For students and teachers
const getTimetable = asyncHandler(async (req, res) => {
    let currentTime = new Date();
    currentTime = moment(currentTime, "hh:mm A").format("hh:mm A");

    const today = moment().format("dddd"); // Get today's day ::Monday
    let { week = false } = req.query;
    week = week === "true" ? true : false;
    
    const currentUser = req?.user?.role;
    
    if (currentUser === roles.student) {
        const student = await Student.findById(req?.user?._id).select("sectionId");

        if (!student) throw new ApiError(404, "Student not found");

        const timetables = await TimeTabels.aggregate([
            {
                $match: {
                    section: student.sectionId,
                    ...(!week && { day: today }),
                },
            },
            {
                $lookup: {
                    from: "teachers",
                    localField: "teacher",
                    foreignField: "_id",
                    as: "teacher",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "_id",
                                foreignField: "_id",
                                as: "user",
                                pipeline: [
                                    {
                                        $project: { fullName: 1 },
                                    },
                                ],
                            },
                        },
                        { $unwind: "$user" },
                        {
                            $addFields: { fullName: "$user.fullName" },
                        },
                        {
                            $project: { fullName: 1 },
                        },
                    ],
                },
            },
            { $unwind: "$teacher" },
            {
                $sort: { "timeslot.start": 1 },
            },
            {
                $addFields: {
                    teacher: "$teacher.fullName",
                    isOngoing: {
                        $cond: {
                            if: {
                                $and: [
                                    { $lte: ["$timeslot.start", currentTime] }, // startTime <= now
                                    { $gte: ["$timeslot.end", currentTime] }, // endTime >= now
                                    { $eq: ["$day", today] }, // today!
                                ],
                            },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            { $sort: { "timeslot.start": 1 } },
            {
                $project: {
                    _id: 1,
                    subject: 1,
                    day: 1,
                    timeslot: 1,
                    teacher: 1,
                    isOngoing: 1,
                },
            },
        ]);

        if (timetables.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        `No timetable found for ${week ? "week" : "today"}`
                    )
                );
        }

        if (!week) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "Student Timetable fetched successfully",
                        timetables
                    )
                );
        }

        const weeklyTimetable = {};
        console.log(timetables);
        timetables.forEach((i) => {
            if (!weeklyTimetable[i.day]) {
                weeklyTimetable[i.day] = []; // i are all timetables here!
            }
            weeklyTimetable[i.day].push(i);
        });

        const final_Weekly_tt = Object.keys(weeklyTimetable).map((day) => ({
            day,
            data: weeklyTimetable[day],
            ...(week && { isToday: day === today }),
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Weekly Student Timetable fetched successfully",
                    final_Weekly_tt
                )
            );
    } else if (currentUser === roles.teacher) {
        const timetables = await TimeTabels.aggregate([
            {
                $match: {
                    teacher: req?.user?._id,
                    ...(!week && { day: today }),
                },
            },
            {
                $lookup: {
                    from: "sections",
                    localField: "section",
                    foreignField: "_id",
                    as: "section",
                    pipeline: [
                        {
                            $project: { name: 1 },
                        },
                    ],
                },
            },
            { $unwind: "$section" },
            { $sort: { "timeslot.start": 1 } },
            {
                $addFields: {
                    section: "$section.name",
                    isOngoing: {
                        $cond: {
                            if: {
                                $and: [
                                    // BOTH THESE STATMENTS CHECKS THAT TIME IS BETWEEN START TIME AND END TIME
                                    { $lte: ["$timeslot.start", currentTime] }, // startTime <= now
                                    { $gte: ["$timeslot.end", currentTime] }, // endTime >= now
                                    // AND THIS STATEMENT CHECKS THAT DAY IS TODAY
                                    { $eq: ["$day", today] },
                                ],
                            },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    subject: 1,
                    day: 1,
                    timeslot: 1,
                    section: 1,
                    isOngoing: 1,
                },
            },
        ]);

        if (timetables.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        `No timetable found for ${week ? "week" : "today"}`
                    )
                );
        }

        if (!week) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "Daily Teacher Timetable fetched successfully",
                        timetables
                    )
                );
        }

        const weeklyTimetable = {};
        
        
        timetables.forEach((i) => {
            if (!weeklyTimetable[i.day]) {
                weeklyTimetable[i.day] = []; // i are all timetables here!
            }
            weeklyTimetable[i.day].push(i);
        });

        const final_Weekly_tt = Object.keys(weeklyTimetable).map((day) => ({
            day,
            data: weeklyTimetable[day],
            ...(week && { isToday: day === today }), // isToday feild for highlighting the current day in the list of weekly timetables
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "Weekly Teacher Timetable fetched successfully",
                    final_Weekly_tt
                )
            );
    } else {
        throw new ApiError(404, "Cannot fetch timetable");
    }
});

// For admin and staff members
const getAllTimetables = asyncHandler(async (req, res) => {
    if (cache.has("timetables")) {
        console.log("Timetables fetched from cache ⏰⏰⏰");
        
		return res
			.status(200)
			.json(new ApiResponse(200, "Timetables fetched successfully", cache.get("timetables")));
	}

    let currentTime = new Date();
    currentTime = moment(currentTime, "hh:mm A").format("hh:mm A");

    const timetables = await TimeTabels.aggregate([
        {
            $lookup: {
                from: "teachers",
                localField: "teacher",
                foreignField: "_id",
                as: "teacher",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "_id",
                            as: "user",
                            pipeline: [
                                {
                                    $project: { fullName: 1 },
                                },
                            ],
                        },
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            fullName: "$user.fullName",
                        },
                    },
                ],
            },
        },
        { $unwind: "$teacher" },
        { $sort: { "timeslot.start": 1 } },
        {
            $lookup: {
                from: "sections",
                localField: "section",
                foreignField: "_id",
                as: "section",
                pipeline: [
                    {
                        $project: { name: 1 },
                    },
                ],
            },
        },
        { $unwind: "$section" },
        {
            $addFields: {
                teacher: "$teacher.fullName",
                isOngoing: {
                    $cond: {
                        if: {
                            $and: [
                                // BOTH THESE STATMENTS CHECKS THAT TIME IS BETWEEN START TIME AND END TIME
                                { $lte: ["$timeslot.start", currentTime] }, // startTime <= now
                                { $gte: ["$timeslot.end", currentTime] }, // endTime >= now
                                { $eq: ["$day", moment().format("dddd")] }
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
                section: "$section.name",
            },
        },
        {
            $project: {
                _id: 1,
                subject: 1,
                day: 1,
                timeslot: 1,
                teacher: 1,
                isOngoing: 1,
                section: 1
            },
        },
    ]);

    if (timetables.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, "No timetables found"));
    }

    //console.log(timetables);

    const weeklyTimetable = {};

    timetables.forEach((i) => {
        if (!weeklyTimetable[i.day]) {
            weeklyTimetable[i.day] = []; // i are all timetables here!
        }
        weeklyTimetable[i.day].push(i);
    });

    const final_Weekly_tt = Object.keys(weeklyTimetable).map((day) => ({
        day,
        data: weeklyTimetable[day],
        isToday: day === moment().format("dddd"), // isToday feild for highlighting the current day in the list of weekly timetables
    }));

    cache.set("timetables", final_Weekly_tt);

    return res
        .status(200)
        .json(new ApiResponse(200, "All Timetables fetched successfully", final_Weekly_tt));
});

const deleteTimetable = asyncHandler(async (req, res) => {
    const { timetableId } = req?.params;
    if (!Types.ObjectId.isValid(timetableId)) throw new ApiError(400, "Invalid timetable id");

    const timetable = await TimeTabels.findByIdAndDelete(timetableId);
    if (!timetable) {
        throw new ApiError(500, "Cannot delete this timetable");
    }

    cache.del("timetables");

    return res
        .status(200)
        .json(new ApiResponse(200, "Timetable deleted successfully"));
});

const deleteAllTimetables = asyncHandler(async (req, res) => {
    const result = await TimeTabels.deleteMany({}).catch((err) => {
        throw new ApiError(500, "Error Occurred while deleting timetables: " + err);
    });

    if (!result) {
        throw new ApiError(500, "Error deleting timetables");
    } else {
        cache.del("timetables");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "All Timetables deleted successfully"));
});

const updateTimetable = asyncHandler(async (req, res) => {
    const { timetableId } = req?.params;
    if (!Types.ObjectId.isValid(timetableId)) throw new ApiError(400, "Invalid timetable id");

    const { startTime, endTime, teacherId, sectionId } = req?.body;
    
    // console.log(req?.body);
    
    checkFieldAvailablity(req?.body, [
		"subject",
		"day",
		"startTime",
		"endTime",
		"teacherId",
		"sectionId",
	]);

    const fields = optionallyUpdateFields(req?.body, [
        "subject",
		"day",
		"startTime",
		"endTime",
		"teacherId",
		"sectionId",
    ]);

    if (fields["teacherId"] != undefined && !Types.ObjectId.isValid(teacherId)) {
        throw new ApiError(400, "Invalid teacher id");
    }
    if (fields["sectionId"] != undefined && !Types.ObjectId.isValid(sectionId)) {
        throw new ApiError(400, "Invalid section id");
    }

    if (fields["startTime"] !== undefined && fields["endTime"] !== undefined) {
        fields["timeslot"] = {
            start: moment.utc(startTime, "hh:mm A").format("hh:mm A"),
            end: moment.utc(endTime, "hh:mm A").format("hh:mm A"),
        };
    }

    const updatedTimetable = await TimeTabels.findByIdAndUpdate(timetableId, {
        ...fields,
    });

    if (!updatedTimetable) throw new ApiError(500, "Error Occurred while updating timetable");

    cache.del("timetables");

    return res
        .status(200)
        .json(new ApiResponse(200, "Timetable updated successfully"));
});

export {
    createTimetable,
    getTimetable,
    deleteTimetable,
    updateTimetable,
    getAllTimetables,
    createBulkTimetable,
    getBulkSampleTimetable,
    deleteAllTimetables
};
