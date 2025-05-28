import { Types } from "mongoose";
import xlsx from "xlsx-js-style";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { validateRequiredFields, validateEmail, validatePassword, validatePhoneNumber, checkFieldAvailablity, optionallyUpdateFields, isValidDate } from "../utils/validations.js";
import { autoGenerateFee, autoGeneratePassword, autoGenerateRollNumber, credentialsValidations, decryptPassword, encryptPassword, generateDecodedToken, unlinkExcelFile } from "../utils/helpers.js";
import { Teacher } from "../models/teacher.model.js";
import moment from "moment";
import { NO_OF_SEMESTERS, roles, xlsxSheetDataStyles } from "../constants.js";
import { xlsxSheetHeaderStyles } from "../constants.js";
import { getRoleId } from "./roles.controller.js";
import { cacheService as cache } from "../utils/cacheService.js";

const generateAccess_RefreshToken = async (id) => {
    try {
        const user = await User.findById(id);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error(error);
        throw new ApiError(500, "Something went wrong while generating access or refresh token");
    }
}

const logoutUser = asyncHandler(async (req, res) => {
    // throw new ApiError(404, "Checking loggers!");
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: { refreshToken: undefined },
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(404, "User not found");
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, "Current user found successfully", req.user)
        )
});

const updateUserPassword = asyncHandler(async (req, res) => {
    const { userId } = req?.params;
    const { oldPassword, newPassword } = req?.body;

    validateRequiredFields(req?.params, ["userId"]);
    validateRequiredFields(req?.body, ["oldPassword", "newPassword"]);

    if (!Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user id");

    credentialsValidations({ password: newPassword.trim() });

    const user = await User.findById(userId).select("+password").lean();
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect) throw new ApiError(401, "Incorrect Password");

    user.password = newPassword.trim();
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully"));
});

const loginStudent = asyncHandler(async (req, res) => {
    const { email, password } = req?.body;
    validateRequiredFields(req?.body, ["email", "password"]);
    credentialsValidations({ email: email.trim() });
    const stdRole = await getRoleId(roles.student);

    const user = await User.findOne({
        email: email.trim(),
        role: stdRole
    }).select("_id email password");

    if (!user) throw new ApiError(404, "Student not found. Invalid Email Id provided");

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) throw new ApiError(401, "Incorrect Password");
    
    const loggedInStudent = await User.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(user._id)
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "_id",
                as: "studentDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "classes",
                            localField: "classId",
                            foreignField: "_id",
                            as: "classDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$classDetails" },
                    {
                        $lookup: {
                            from: "sections",
                            localField: "sectionId",
                            foreignField: "_id",
                            as: "sectionDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$sectionDetails" },
                    {
                        $lookup: {
                            from: "programs",
                            localField: "program",
                            foreignField: "_id",
                            as: "programDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$programDetails" },
                    {
                        $addFields: {
                            program: "$programDetails.name",
                            class: "$classDetails.name",
                            section: "$sectionDetails.name",
                        }
                    },
                ]
            }
        },
        { $unwind: "$studentDetails" },
        {
            $project: {
                role: 0,
                password: 0,
                updatedAt: 0,
                refreshToken: 0,
                __v: 0,
                "studentDetails.classId": 0,
                "studentDetails.sectionId": 0,
                "studentDetails.classDetails": 0,
                "studentDetails.sectionDetails": 0,
                "studentDetails.programDetails": 0,
                "studentDetails._id": 0,
                "studentDetails.__v": 0,
                "studentDetails.createdAt": 0,
                "studentDetails.updatedAt": 0,
            }
        }
    ]);

    if (!loggedInStudent[0]) throw new ApiError(500, "Something went wrong while logging in student");

    loggedInStudent[0] = {
        ...loggedInStudent[0],
        ...loggedInStudent[0].studentDetails
    }

    delete loggedInStudent[0].studentDetails;

    loggedInStudent[0].feeDetails.semesterFees.map((fee) => 
        fee.dueDate = moment(fee.dueDate).format("DD-MM-YYYY")
    );

    loggedInStudent[0].dob = moment(loggedInStudent[0].dob).format("DD-MM-YYYY");
    loggedInStudent[0].createdAt = moment(loggedInStudent[0].createdAt).format("DD-MM-YYYY");

    const options = {
        httpOnly: true,
        secure: true,
        // sameSite: "Strict"
    }

    const { accessToken, refreshToken } = await generateAccess_RefreshToken(user._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse( 200, "Student logged in successfully!",
            { user: { ...loggedInStudent[0], role: roles.student }, refreshToken, accessToken },
        )
    );
});

const loginTeacher = asyncHandler(async (req, res) => {
    const { email, password } = req?.body;
    validateRequiredFields(req?.body, ["email", "password"]);
    credentialsValidations({ email: email.trim() });

    const tchRole = await getRoleId(roles.teacher);

    const user = await User.findOne({
        email: email.trim(),
        role: tchRole
    }).select("_id email password");

    if (!user) throw new ApiError(404, "Teacher not found. Invalid Email Id provided");

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) throw new ApiError(401, "Incorrect Password");

    const loggedInTeacher = await User.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(user._id)
            }
        },
        {
            $lookup: {
                from: "teachers",
                localField: "_id",
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
                        $addFields: {
                            departments: "$departmentsDetails.name" // TODO: REMOVE .name if also want to get hte ids of departments!
                        }
                    },
                    {
                        $project: {
                            departmentsDetails: 0
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$teacherDetails"
        },
        {
            $project: {
                role: 0,
                password: 0,
                updatedAt: 0,
                refreshToken: 0,
                __v: 0,
                "teacherDetails._id": 0,
                "teacherDetails.__v": 0,
                "teacherDetails.createdAt": 0,
                "teacherDetails.updatedAt": 0
            }
        }
    ]);
    
    if (!loggedInTeacher[0]) throw new ApiError(500, "Something went wrong while logging in teacher");

    loggedInTeacher[0] = {
        ...loggedInTeacher[0],
        ...loggedInTeacher[0].teacherDetails
    }

    delete loggedInTeacher[0].teacherDetails;

    loggedInTeacher[0].dob = moment(loggedInTeacher[0].dob).format("DD-MM-YYYY");
    loggedInTeacher[0].createdAt = moment(loggedInTeacher[0].createdAt).format("DD-MM-YYYY");

    const options = {
        httpOnly: true,
        secure: true,
        // sameSite: "Strict"
    }

    const { accessToken, refreshToken } = await generateAccess_RefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "Teacher logged in successfully!",
                { user: { ...loggedInTeacher[0], role: roles.teacher }, refreshToken, accessToken },
            )
        );
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req?.body;
    validateRequiredFields(req?.body, ["email", "password"]);
    credentialsValidations({ email: email.trim() });

    const adminRole = await getRoleId(roles.admin);

    const user = await User.findOne({
        email: email.trim(),
        role: adminRole
    }).select("-createdAt -updatedAt -__v -role -refreshToken -dob");

    if (!user) throw new ApiError(404, "Admin not found");

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) throw new ApiError(401, "Incorrect Password");

    user.password = undefined;

    const options = {
        httpOnly: true,
        secure: true,
        // sameSite: "Strict"
    }

    const { accessToken, refreshToken } = await generateAccess_RefreshToken(user._id);
    
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "Admin logged in successfully!",
                { user: { ...user._doc, role: roles.admin }, refreshToken, accessToken },
            )
        );
});

const loginStaffMember = asyncHandler(async (req, res) => {
    const { email, password } = req?.body;
    validateRequiredFields(req?.body, ["email", "password"]);
    credentialsValidations({ email: email.trim() });

    const staffRole = await getRoleId(roles.staff);

    const user = await User.findOne({
        email: email.trim(),
        role: staffRole
    }).select("-createdAt -updatedAt -__v -refreshToken -dob -role");

    if (!user) throw new ApiError(404, "Staff member not found");

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) throw new ApiError(401, "Incorrect Password");

    user.password = undefined;

    const options = {
        httpOnly: true,
        secure: true
    }

    const { accessToken, refreshToken } = await generateAccess_RefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "Staff member logged in successfully!",
                { user: { ...user._doc, role: roles.staff }, refreshToken, accessToken },
            )
        );
});

const addStudent = asyncHandler(async (req, res) => {
    const {
        fullName,
        email,
        contactNumber,
        gender,
        dob,
        address,
        classId,
        sectionId,
        program,
        sessionYears,
        totalMarks,
        obtainedMarks,
        totalFee,
        status,
    } = req?.body;

    validateRequiredFields(req?.body, [
        "fullName",
        "email",
        "contactNumber",
        "gender",
        "dob",
        "address",
        "classId",
        "sectionId",
        "program",
        "sessionYears",
        "totalMarks",
        "obtainedMarks",
        "totalFee"
    ]);

    credentialsValidations({ email, contactNumber });
    // console.log(req.body);
    
    // return;
    const role = await getRoleId(roles.student);

    const existedUser = await User.findOne(
        { $and: [{ email: email.trim() }, { role: role }] }
    );

    if (existedUser) throw new ApiError(409, "User with email already exists");

    [classId, sectionId, program].forEach((id, index) => {
        if (!Types.ObjectId.isValid(id)) throw new ApiError(
            400, `Invalid ${index === 0 ? "class" : index === 1 ? "section" : "program"} id provided`
        );
    });

    const rollNo = await autoGenerateRollNumber();
    const autoPass = await autoGeneratePassword(rollNo);
    console.log("rollNo:\t", rollNo);
    const pass = encryptPassword(autoPass);
    console.log("pass:\t", pass);
    //return;
    const user = await User.create({
        fullName: fullName.trim(),
        email: email.trim(),
        password: pass,
        role,
        contactNumber: contactNumber.trim(),
        gender,
        dob,
        address: address.trim(),
    });
    
    if (!user) throw new ApiError(400, "Error adding initial user");
    
    const fee = autoGenerateFee({ totalMarks, obtainedMarks, totalFee_Input: totalFee });
    
    const student = await Student.create({
        _id: user._id,
        classId,
        sectionId,
        program,
        rollNumber: rollNo,
        sessionYears,
        feeDetails: {
            scholorShip: fee.discount,
            totalFee: fee.totalFee,
            paidFee: 0,
            dueFee: 0,
            semesterFees: fee.semesterFees
        },
        status: status ? status : "Active"
    });

    if (!student) throw new ApiError(400, "Error adding student");

    const createdStudent = await Student.aggregate([
        { $match: { _id: user._id } },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    { $project: { fullName: 1, email: 1, contactNumber: 1, gender: 1 } },
                ]
            }
        },
        { $unwind: "$userDetails" },
        {
            $lookup: {
                from: "classes",
                localField: "classId",
                foreignField: "_id",
                as: "classId",
                pipeline: [
                    { $project: { _id: 1, name: 1 } },
                ]
            },
            
        },
        { $unwind: "$classId" },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionId",
                pipeline: [
                    { $project: { _id: 1, name: 1 } },
                ]
            }
        },
        { $unwind: "$sectionId" },
        {
            $lookup: {
                from: "programs",
                localField: "program",
                foreignField: "_id",
                as: "program",
                pipeline: [
                    { $project: { _id: 1, name: 1 } },
                ]
            }
        },
        { $unwind: "$program" },
        {
            $addFields: {
                fullName: "$userDetails.fullName",
                email: "$userDetails.email",
                contactNumber: "$userDetails.contactNumber",
                gender: "$userDetails.gender",
            }
        },
        {
            $project: {
                _id: 1,
                fullName: 1,
                email: 1,
                contactNumber: 1,
                gender: 1,
                classId: 1,
                sectionId: 1,
                program: 1,
                rollNumber: 1,
                sessionYears: 1,
                feeDetails: 1,
                status: 1
            }
        }
    ]);

    if (!createdStudent[0]) throw new ApiError(500, "Error fetching added student");

    return res
        .status(201)
        .json(new ApiResponse(201, "Student added successfully", createdStudent[0]));
});

const getBulkSampleStudents = asyncHandler(async (req, res) => {
    const sampleData = [
        {
            "Sr. No": 1,
            "Full Name": "Sample Student One",
            "Email": "sample_std_879@clg.com",
            "Contact Number": "+923411137832",
            "Gender": "Male",
            "Date of Birth": "5-10-2001",
            "Address": "Sample Gali",
            "Class Id": "6799d76149673a62755241b7",
            "Section Id": "6799d78049673a62755241ba",
            "Program Id": "679f23dbf23d27238803419c",
            "Session Years": "2023-2025",
            "Total Marks": 555,
            "Obtained Marks": 439,
            "Total Fee": 150000,
            "Status": "Active"
        },
        {
            "Sr. No": 2,
            "Full Name": "Sample Student Two",
            "Email": "sample_std_279@clg.com",
            "Contact Number": "+923455537832",
            "Gender": "Female",
            "Date of Birth": "5-10-2001",
            "Address": "Sample Gali 2",
            "Class Id": "6799d76149673a62755241b7",
            "Section Id": "6799d78049673a62755241ba",
            "Program Id": "679f23dbf23d27238803419c",
            "Session Years": "2023-2025",
            "Total Marks": 555,
            "Obtained Marks": 439,
            "Total Fee": 150000,
            "Status": "Inactive"
        },
        {
            "Sr. No": 3,
            "Full Name": "Sample Student Three",
            "Email": "sample_std_8879@clg.com",
            "Contact Number": "+923455537878",
            "Gender": "Other",
            "Date of Birth": "10-10-2001",
            "Address": "Sample Gali 4",
            "Class Id": "6799d76149673a62755241b7",
            "Section Id": "6799d78049673a62755241ba",
            "Program Id": "679f23dbf23d27238803419c",
            "Session Years": "2023-2025",
            "Total Marks": 555,
            "Obtained Marks": 500,
            "Total Fee": 150000,
            "Status": "Active"
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
        { wch: 10 }, // Sr. No
        { wch: 40 }, // Full Name
        { wch: 40 }, // Email 
        { wch: 25 }, // Contact Number
        { wch: 16 }, // Gender
        { wch: 20 }, // Date of Birth
        { wch: 37 }, // Address
        { wch: 37 }, // Class
        { wch: 37 }, // Section
        { wch: 37 }, // Program
        { wch: 23 }, // Session Years
        { wch: 13 }, // Total Marks
        { wch: 19 }, // Obtained Marks
        { wch: 20 }, // Total Fee,
        { wch: 20 }, // Status
    ];

    // Set row heights
    worksheet["!rows"] = [{ hpt: 20 }, { hpt: 18 }];

    xlsx.utils.book_append_sheet(workbook, worksheet, "Sample Students Data");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Define file path using __dirname
    const filePath = join(__dirname, "../public/temp/sample_student_entry.xlsx");

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

        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file from server:", unlinkErr);
        });

        return res
            .status(500)
            .send("Failed to generate sample students data entry file")
    }

    // Set headers explicitly and send the file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_student_entry.xlsx"');

    // Send the file for download
    res.download(filePath, "sample_student_entry.xlsx", (downloadErr) => {
        if (downloadErr) {
            console.error("Error downloading file:", downloadErr);
            return res
                .status(500)
                .send("Failed to downloading sample students data entry file");
        }

        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file from server:", unlinkErr);
        });
    });
    
});

const addStudentsInBulk = asyncHandler(async (req, res) => {
    //console.time("addStudents");
    if (!req.file) throw new ApiError(400, "No file uploaded");

    const filePath = req.file.path;

    // Assuming first sheet (inform frontend to ensure single sheet)
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    let formattedData = [];
    formattedData = jsonData.map((std) => {
        if(std["Class Id"] && !Types.ObjectId.isValid(std["Class Id"].trim())) {
            throw new ApiError(400, `Invalid Class Id: ${std["Class Id"]}`);
        }
        if(std["Section Id"] && !Types.ObjectId.isValid(std["Section Id"].trim())) {
            throw new ApiError(400, `Invalid Section Id: ${std["Section Id"]}`);
        }
        if(std["Program Id"] && !Types.ObjectId.isValid(std["Program Id"].trim())) {
            throw new ApiError(400, `Invalid Program Id: ${std["Program Id"]}`);
        }

        return {
            fullName: std["Full Name"].trim(),
            email: std["Email"].trim(),
            contactNumber: std["Contact Number"].trim(),
            gender: std["Gender"].trim(),
            dob: std["Date of Birth"],
            address: std["Address"].trim(),
            classId: std["Class Id"].trim(),
            sectionId: std["Section Id"].trim(),
            program: std["Program Id"].trim(),
            sessionYears: std["Session Years"].trim(),
            totalMarks: std["Total Marks"],
            obtainedMarks: std["Obtained Marks"],
            totalFee: std["Total Fee"],
            status: std["Status"].trim()
        }
    });
      
    const lastStudent = await Student.findOne().sort({ rollNumber: -1 }).select("rollNumber").lean();

    if(!lastStudent) throw new ApiError(400, "Error while generating password");
    let rollNumber = lastStudent.rollNumber;

    for (let i = 0; i < formattedData.length; i++) {
        validateRequiredFields(formattedData[i], [
            "fullName",
            "email",
            "contactNumber",
            "gender",
            "dob",
            "address",
            "classId",
            "sectionId",
            "program",
            "sessionYears",
            "totalMarks",
            "obtainedMarks",
            "totalFee",
            "status",
        ]);

        if (formattedData[i].gender !== "Male" && formattedData[i].gender !== "Female" && formattedData[i].gender !== "Other") {
            throw new ApiError(400, `Invalid Gender: ${formattedData[i].gender} found in row ${i + 1}`);   
        }
        if (formattedData[i].status !== "Active" && formattedData[i].status !== "Inactive") {
            throw new ApiError(400, `Invalid Status: ${formattedData[i].status} found in row ${i + 1}`);
        }
        if (formattedData[i].sessionYears.split('-').length > 2) {
            throw new ApiError(400, `Invalid Session Years: ${formattedData[i].sessionYears} found in row ${i + 1}`);
        }
        if (formattedData[i].totalMarks <= 0) {
            throw new ApiError(400, `Invalid Total Marks: ${formattedData[i].totalMarks} found in row ${i + 1}`);
        }

        credentialsValidations({ 
            email: formattedData[i].email,
            contactNumber: formattedData[i].contactNumber
        });

        formattedData[i].rollNumber = ++rollNumber;
        const autoGeneratedPass = await autoGeneratePassword(formattedData[i].rollNumber);

        formattedData[i].password = autoGeneratedPass;
        credentialsValidations({ password: formattedData[i].password });

        formattedData[i].password = encryptPassword(formattedData[i].password);

        const fee = autoGenerateFee({
            totalMarks: formattedData[i].totalMarks,
            obtainedMarks: formattedData[i].obtainedMarks,
            totalFee_Input: formattedData[i].totalFee
        });

        delete formattedData[i].totalMarks;
        delete formattedData[i].obtainedMarks;

        if (formattedData[i].feeDetails == undefined) {
            formattedData[i].feeDetails = {
                scholorShip: fee.discount,
                totalFee: fee.totalFee,
                paidFee: 0,
                dueFee: 0,
                semesterFees: fee.semesterFees
            }
        }
    }
    console.log(formattedData);
    
    try {
        const studentRoleId = await getRoleId(roles.student);
    
        // Step 1: Prepare user insert operations
        const userOperations = formattedData.map((data) => ({
            insertOne: {
                document: {
                    fullName: data.fullName,
                    email: data.email,
                    password: data.password,
                    role: studentRoleId,
                    contactNumber: data.contactNumber,
                    gender: data.gender,
                    dob: data.dob,
                    address: data.address
                }
            }
        }));
    
        // Step 2: Execute bulk write for users
        const userBulkResult = await User.bulkWrite(userOperations, { ordered: false });
    
        // Step 3: Extract and assign inserted IDs
        const insertedIds = userBulkResult.insertedIds; // Object with indices as keys
        formattedData.forEach((data, index) => {
            data._id = insertedIds[index].toString(); // Assign the ID to formattedData
        });
    
        console.log("Updated formattedData with _id:", formattedData);
    } catch (error) {
        throw new ApiError(500, "Error adding students' basic details", error);
    } finally {
        unlinkExcelFile(filePath); // Unlink input file
    }
    
    try {
        // Step 4: Prepare student insert operations
        const studentOperations = formattedData.map((data) => ({
            insertOne: {
                document: {
                    _id: data._id, // Use the same _id as the user
                    classId: data.classId,
                    sectionId: data.sectionId,
                    program: data.program,
                    rollNumber: data.rollNumber,
                    sessionYears: data.sessionYears,
                    feeDetails: data.feeDetails,
                    status: data.status || "Active"
                }
            }
        }));
    
        // Step 5: Execute bulk write for students
        await Student.bulkWrite(studentOperations, { ordered: false });
    } catch (error) {
        throw new ApiError(500, "Error adding students' academic details", error);
    } finally {
        unlinkExcelFile(filePath); // Unlink input file
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Students added successfully"));
});

const getStudent = asyncHandler(async (req, res, next) => {
    const { studentId } = req?.params;
    validateRequiredFields(req?.params, ["studentId"]);
    if (!Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid student id");

    if (cache.has(`student-${studentId}`)) {
        const cachedStd = cache.get(`student-${studentId}`);
        console.log("Single Student Cache Hit 😘");
        if (cachedStd) {
            return res
                .status(200)
                .json(new ApiResponse(200, "Student fetched successfully", cachedStd));
        }
    }

    const student = await User.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(studentId)
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "_id",
                as: "studentDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "classes",
                            localField: "classId",
                            foreignField: "_id",
                            as: "classDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$classDetails" },
                    {
                        $lookup: {
                            from: "sections",
                            localField: "sectionId",
                            foreignField: "_id",
                            as: "sectionDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$sectionDetails" },
                    {
                        $lookup: {
                            from: "programs",
                            localField: "program",
                            foreignField: "_id",
                            as: "programDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$programDetails" },
                    {
                        $addFields: {
                            program: "$programDetails.name",
                            class: "$classDetails.name",
                            section: "$sectionDetails.name"
                        }
                    },
                ]
            }
        },
        { $unwind: "$studentDetails" },
        {
            $project: {
                role: 0,
                updatedAt: 0,
                refreshToken: 0,
                __v: 0,
                "studentDetails.classId": 0,
                "studentDetails.sectionId": 0,
                "studentDetails.classDetails": 0,
                "studentDetails.sectionDetails": 0,
                "studentDetails.programDetails": 0,
                "studentDetails._id": 0,
                "studentDetails.__v": 0,
                "studentDetails.createdAt": 0,
                "studentDetails.updatedAt": 0,
            }
        }
    ]);

    if (!student[0]) throw new ApiError(500, "Something went wrong while fetching student's details");

    student[0] = {
        ...student[0],
        ...student[0].studentDetails
    }

    delete student[0].studentDetails;

    student[0].feeDetails.semesterFees.map((fee) => 
        fee.dueDate = moment(fee.dueDate).format("DD-MM-YYYY")
        // console.log(fee.dueDate)
    );
    
    student[0].password = decryptPassword(student[0].password);

    student[0].dob = moment(student[0].dob).format("DD-MM-YYYY");
    student[0].createdAt = moment(student[0].createdAt).format("DD-MM-YYYY");
    cache.set(`student-${student[0]._id}`, student[0]);

    return res
        .status(200)
        .json(new ApiResponse(200, "Student fetched successfully", student[0]));
});

const addNewAdmin = asyncHandler(async (req, res) => {
    const {
        fullName,
        email,
        password,
        contactNumber,
        gender,
        dob,
        address,
    } = req?.body;

    validateRequiredFields(req?.body, [
        "fullName",
        "email",
        "password",
        "contactNumber",
        "gender",
        "dob",
    ]);

    credentialsValidations({ email, password, contactNumber });

    const role = await getRoleId(roles.admin);

    const existedUser = await User.findOne(
        { $and: [{ email: email.trim() }, { role: role }] }
    ).lean();

    if (existedUser) throw new ApiError(409, "User with email already exists");
    
    password = encryptPassword(password);

    const user = await User.create({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        contactNumber: contactNumber.trim(),
        gender,
        dob,
        address: address.trim(),
    });

    if (!user) throw new ApiError(500, "Error adding user");

    const createdUser = await User.findById(user._id).select("-refreshToken -password -__v -role -updatedAt -createdAt -dob");
    if (!createdUser) throw new ApiError(500, "Error fetching added new admin");
    
    return res
        .status(201)
        .json(new ApiResponse(201, "Admin added successfully", createdUser));
});

const removeAdmin = asyncHandler(async (req, res) => {
    const { adminId } = req?.params;
    validateRequiredFields(req?.params, ["adminId"]);
    if (!Types.ObjectId.isValid(adminId)) throw new ApiError(400, "Invalid admin id");

    const removedAdmin = await User.findOneAndDelete({
        _id: adminId,
        role: req?.user?.role._id,
    });
    if (!removedAdmin) throw new ApiError(500, "Error removing admin");

    return res
        .status(200)
        .json(new ApiResponse(200, "Admin removed successfully"));
});

const addNewStaffMember = asyncHandler(async (req, res) => {
    const { fullName, email, password, contactNumber, gender, dob, address } = req?.body;

    validateRequiredFields(req?.body, [
        "fullName",
        "email",
        "password",
        "contactNumber",
        "gender",
        "dob",
    ]);
    
    credentialsValidations({ email, password, contactNumber });

    const role = await getRoleId(roles.staff);

    const existedUser = await User.findOne(
       { email: email.trim(), role: role }
    ).select("_id").lean();

    if (existedUser) throw new ApiError(409, "User with email already exists");

    password = encryptPassword(password);

    const user = await User.create({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        contactNumber: contactNumber.trim(),
        gender,
        dob,
        address: address.trim(),
    });

    if (!user) throw new ApiError(500, "Error adding user");

    const createdUser = await User.findById(user._id).select("-refreshToken -password -__v -role -updatedAt");
    if (!createdUser) throw new ApiError(500, "Error fetching added new staff member");

    return res
        .status(201)
        .json(new ApiResponse(201, "Staff Member added successfully", createdUser));
});

const addTeacher = asyncHandler(async (req, res) => {
    const {
		fullName,
		email,
		password,
		contactNumber,
		gender,
		dob,
		address,
		departments,
		subjectSpecialization,
		salaryDetails,
		status,
	} = req?.body;

    validateRequiredFields(req?.body, [
        "fullName",
        "email",
        "password",
        "contactNumber",
        "gender",
        "dob",
        "address",
        "departments",
        "subjectSpecialization",
        "salaryDetails",
    ]);

    credentialsValidations({ email, password, contactNumber });

    const role = await getRoleId(roles.teacher);

    const existedUser = await User.findOne(
        { $and: [{ fullName: fullName.trim() }, { email: email.trim() }, { role: role }] }
    );

    if (existedUser) throw new ApiError(409, "User with email already exists");

    const encrpytedPassword = encryptPassword(password);

    const user = await User.create({
        fullName: fullName.trim(),
        email: email.trim(),
        password: encrpytedPassword,
        role,
        contactNumber: contactNumber.trim(),
        gender,
        dob,
        address: address.trim(),
    });

    if (!user) throw new ApiError(400, "Error adding user");

    let dept = [];

    for (let i = 0; i < departments.length; i++) {
        dept.push(departments[i].trim());
    }

    if(dept.length === 0) {
        throw new ApiError(400, "Please select at least one department");
    }

    if (status != undefined) {
        if (status != "Active" && status != "Inactive") throw new ApiError(400, "Status must be either 'Active' or 'Inactive'");    
    }
        
    const teacher = await Teacher.create({
        _id: user._id,
        departments: dept,
        subjectSpecialization: subjectSpecialization.trim(),
        salaryDetails: {
            baseSalary: salaryDetails.baseSalary,
            bonuses: salaryDetails.bonuses || [],
            deductions: salaryDetails.deductions || [],
        },
        status: status ?? "Active"
    });

    if (!teacher) throw new ApiError(400, "Error adding teacher");

    const createdUser = await Teacher.aggregate([
        { $match: { _id: user._id } },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
    ])
    if (!createdUser[0]) throw new ApiError(400, "Error fetching added teacher");

    return res
        .status(201)
        .json(new ApiResponse(201, "Teacher added successfully", createdUser[0]));
});

const getAllTeachers = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        sortBy = "fullName", 
        sortType = "desc", // enum: asc | desc
        filterType = "$gte", // e.g., $gte, $lte, $gt, $lt, or $gte-$lte
        subjectSpecialization, 
        status, // enum: Active | Inactive
        fullName,
        email,
        gender, 
        baseSalary,
        departments
    } = req?.query;

    switch (sortBy) {
        case "fullName":
        case "email":
        case "gender":
        case "subjectSpecialization":
        case "salaryDetails.baseSalary":
            break;
        default:
            throw new ApiError(400, "Invalid sortBy field. It must be fullName or email or gender or subjectSpecialization or salaryDetails.baseSalary and should not be an empty string");
    }

    switch (sortType) {
        case "asc":
        case "desc":
            break;
        default:
            throw new ApiError(400, "Invalid sort type. It must be asc or desc and should not be an empty string also");
    }

    if (status) {
        switch (status) {
            case "Active":
            case "Inactive":
                break;
            default:
                throw new ApiError(400, "Invalid status. It must be Active or Inactive and should not be an empty string also");
        }
    }

    if (baseSalary) {
        const salaryParts = baseSalary.split('-');
        if (salaryParts.length > 2) {
            throw new ApiError(400, "Invalid base salary. It should have at most two parts separated by '-'");
        }

        const validOperators = ["$gte", "$lte", "$gt", "$lt", "$gte-$lte"];
        if (salaryParts.length === 1) {
            // Single value requires a single operator
            if (!validOperators.includes(filterType)) {
                throw new ApiError(400, "Invalid filter type for single value. It must be $gte, $lte, $gt, or $lt");
            }
        } else if (salaryParts.length === 2) {
            // Range requires a compound filter type (e.g., $gte-$lte)
            const filterParts = filterType.split('-');
            console.log(filterParts, salaryParts, baseSalary);
            
            if (filterParts.length !== 2 || !filterParts.every(ft => validOperators.includes(ft))) {
                throw new ApiError(400, "Invalid filter type for range. It must be two parts like $gte-$lte");
            }
        }
    }

    const query = {};

    if (subjectSpecialization) query.subjectSpecialization = { $regex: subjectSpecialization, $options: "i" };
    if (status) query.status = status;

    if (baseSalary) {
        const salaryParts = baseSalary.split('-');
        if (salaryParts.length === 1) {
            query["salaryDetails.baseSalary"] = { [filterType]: Number(baseSalary) };
        } else {
            const [minOp, maxOp] = filterType.split('-');
            query["salaryDetails.baseSalary"] = { 
                [minOp]: Number(salaryParts[0]), 
                [maxOp]: Number(salaryParts[1]) 
            };
        }
    }

    //console.log(`fullName = ${fullName}\nemail = ${email}\ngender = ${gender}`);
    
    const aggregationPipeline = [
		{
			$lookup: {
				from: "users",
				localField: "_id",
				foreignField: "_id",
				as: "personalDetails",
				pipeline: [
					{
						$project: {
							fullName: 1,
							email: 1,
							gender: 1,
							dob: 1,
							createdAt: 1,
						},
					},
				],
			},
		},
		{ $unwind: "$personalDetails" },
		{
			$lookup: {
				from: "departments",
				localField: "departments",
				foreignField: "_id",
				as: "departments",
				pipeline: [{ $project: { name: 1 } }],
			},
		},
		{
			$match: {
				...query,
				...(departments && {
					"departments._id": new Types.ObjectId(departments),
				}),
				...(fullName && { "personalDetails.fullName": { $regex: fullName, $options: "i" } }),
				...(email && { "personalDetails.email": { $regex: email, $options: "i" } }),
				...(gender && { "personalDetails.gender": gender }),
			},
		},
		{ $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
		{
			$addFields: {
				fullName: "$personalDetails.fullName",
				email: "$personalDetails.email",
				gender: "$personalDetails.gender",
				departments: "$departments.name",
				totalSalary: {
					$add: [
						{
							$subtract: [
								{ $ifNull: ["$salaryDetails.baseSalary", 0] }, // Default to 0 if baseSalary is missing
								{
									$sum: {
										$map: {
											input: { $ifNull: ["$salaryDetails.deductions", []] }, // Default to [] if deductions is missing
											as: "deduction",
											in: { $ifNull: ["$$deduction.amount", 0] }, // Default to 0 if amount is missing
										},
									},
								},
							],
						},
						{
							$sum: {
								$map: {
									input: { $ifNull: ["$salaryDetails.bonuses", []] }, // Default to [] if bonuses is missing
									as: "bonus",
									in: { $ifNull: ["$$bonus.amount", 0] }, // Default to 0 if amount is missing
								},
							},
						},
					],
				},
				dob: "$personalDetails.dob",
				createdAt: "$personalDetails.createdAt",
			},
		},
		{
			$project: {
				salaryDetails: 0,
				updatedAt: 0,
				personalDetails: 0,
				__v: 0,
			},
		},
	];

    const paginationOptions = {
        page: Number(page),
        limit: Number(limit),
    };

    const teachers = await Teacher.aggregatePaginate(Teacher.aggregate(aggregationPipeline), paginationOptions);

    for(let i=1; i<=teachers.docs.length; i++) {
        console.log(teachers.docs[i-1]);
        
        teachers.docs[i-1].createdAt = moment(teachers.docs[i-1].createdAt, "DD-MM-YYYY").format("DD-MM-YYYY");
        teachers.docs[i-1].dob = moment(teachers.docs[i-1].dob, "DD-MM-YYYY").format("DD-MM-YYYY");
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Teachers fetched successfully", {
            teachers: teachers.docs,
            pagination: {
                ...teachers,
                docs: undefined
            },
            sortBy,
            sortType
        }));
});

const getAllAdmins = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "asc" } = req?.query;
    
    switch (sortBy) {
        case "fullName":
        case "createdAt":
            break;
        default:
            throw new ApiError(400, "Invalid sortBy field. It must be fullName or createdAt and should not be an empty string");
    }

    switch (sortType) {
        case "asc":
        case "desc":
            break;
        default:
            throw new ApiError(400, "Invalid sortType field. It must be asc or desc and should not be an empty string");
    }

    const totalAdmins = await User.countDocuments({
        role: new Types.ObjectId(req?.user?.role?._id),
        ...(query && { fullName: { $regex: query, $options: "i" } })
    });

    const admins = await User.aggregate([
        {
            $match: {
                role: new Types.ObjectId(req?.user?.role?._id),
                ...(query && { fullName: { $regex: query, $options: "i" } })
            }
        },
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
        {
            $project: {
                password: 0,
                __v: 0,
                refreshToken: 0,
                role: 0,
                updatedAt: 0
            }
        }
    ]);

    if(admins.length === 0) throw new ApiError(404, "No admins found");

    for(let i=1; i<=admins.length; i++) {
        admins[i-1].createdAt = moment(admins[i-1].createdAt, "DD-MM-YYYY").format("DD-MM-YYYY");
        admins[i-1].dob = moment(admins[i-1].dob, "DD-MM-YYYY").format("DD-MM-YYYY");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Admins fetched successfully", {
            admins,
            limit: Number(limit),
            page,
            totalAdmins,
            sortBy,
            sortType
        }));
});

const getAllStaffMembers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "asc" } = req?.query;
    
    switch (sortBy) {
        case "fullName":
        case "createdAt":
            break;
        default:
            throw new ApiError(400, "Invalid sortBy field. It must be fullName or createdAt and should not be an empty string");
    }

    switch (sortType) {
        case "asc":
        case "desc":
            break;
        default:
            throw new ApiError(400, "Invalid sortType field. It must be asc or desc and should not be an empty string");
    }

    const staffRole = await getRoleId(roles.staff);

    const totalStaff = await User.countDocuments({
        role: staffRole._id,
        ...(query && { fullName: { $regex: query, $options: "i" } })
    });

    const staffMembers = await User.aggregate([
        {
            $match: {
                role: staffRole._id,
                ...(query && { fullName: { $regex: query, $options: "i" } })
            }
        },
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
        {
            $project: {
                password: 0,
                __v: 0,
                refreshToken: 0,
                role: 0,
                updatedAt: 0
            }
        }
    ]);

    if(staffMembers.length === 0) throw new ApiError(404, "No staff members found");

    for(let i=1; i<=staffMembers.length; i++) {
        staffMembers[i-1].createdAt = moment(staffMembers[i-1].createdAt, "DD-MM-YYYY").format("DD-MM-YYYY");
        staffMembers[i-1].dob = moment(staffMembers[i-1].dob, "DD-MM-YYYY").format("DD-MM-YYYY");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Admins fetched successfully", {
            staffMembers,
            limit: Number(limit),
            page,
            totalStaff,
            sortBy,
            sortType
        }));
});

const getAllStudents = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10,
        sortBy = "rollNumber", 
        sortType = "desc", // enum: asc | desc
        rollNumber,
        program,
        fullName,
        gender, 
        status, // enum: Active | Inactive | Alumni
        classId,
        sectionId,
    } = req?.query;

    switch (sortBy) {
        case "rollNumber":
        case "gender":
        case "createdAt":
            break;
        default:
            throw new ApiError(400, "Invalid sortBy field. It must be rollNumber or gender or createdAt and should not be an empty string");
    }
    //console.log(sortBy);
    
    switch (sortType) {
        case "asc":
        case "desc":
            break;
        default:
            throw new ApiError(400, "Invalid sortType field. It must be asc or desc and should not be an empty string");
    }

    if (status) {
        switch (status) {
            case "Active":
            case "Inactive":
            case "Alumni":
                break;
            default:
                throw new ApiError(400, "Invalid status. It must be Active, Inactive or Alumni and should not be an empty string also");
        }
    }

    const aggregationPipeline = [
        { $match: {} },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "personalDetails",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            gender: 1,
                            dob: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$personalDetails" },
        {
            $lookup: {
                from: "programs",
                localField: "program",
                foreignField: "_id",
                as: "programDetails",
            }
        },
        { $unwind: "$programDetails" },
        {
            $lookup: {
                from: "classes",
                localField: "classId",
                foreignField: "_id",
                as: "classDetails"
            }
        },
        { $unwind: "$classDetails" },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        { $unwind: "$sectionDetails" },
        { 
            $match: {
                ...(fullName && { "personalDetails.fullName": { $regex: fullName, $options: "i" } }),
                ...(gender && { "personalDetails.gender": gender }),
                ...(rollNumber && { "rollNumber": Number(rollNumber) }),
                ...(program && { "program": program }),
                ...(status && { "status": status }),
                ...(classId && { "classId": new Types.ObjectId(classId) }),
                ...(sectionId && { "sectionId": new Types.ObjectId(sectionId) }),
            }
        },
        // { $skip: (Number(page) - 1) * Number(limit) },
        // { $limit: Number(limit) },
        {
            $addFields: {
                fullName: "$personalDetails.fullName",
                gender: "$personalDetails.gender",
                program: "$programDetails.name",
                class: "$classDetails.name",
                section: "$sectionDetails.name",
                dob: "$personalDetails.dob"
            }
        },
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
        {
            $project: {
                "personalDetails": 0,
                "feeDetails": 0,
                "programDetails": 0,
                "classDetails": 0,
                "sectionDetails": 0,
                classId: 0,
                sectionId: 0,
                updatedAt: 0,
                __v: 0
            }
        }
    ]

    const paginationOptions = {
        page: Number(page),
        limit: Number(limit),
    };
    
    const students = await Student.aggregatePaginate(Student.aggregate(aggregationPipeline), paginationOptions);
    
    for(let i=1; i<= students.docs.length; i++) {
        students.docs[i-1].createdAt = moment(students.docs[i-1].createdAt, "DD-MM-YYYY").format("DD-MM-YYYY");
        
        students.docs[i-1].dob = moment(students.docs[i-1].dob, "DD-MM-YYYY").format("DD-MM-YYYY");
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Students fetched successfully", {
            students: students.docs,
            pagination: {
                ...students,
                docs: undefined
            },
            sortBy,
            sortType
        }));
});

const updateStdDetails = asyncHandler(async (req, res) => {
    const { studentId } = req?.params;
    validateRequiredFields(req?.params, ["studentId"]);
    if (!Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid student id");

    const { program, classId, sectionId, status, fullName, address, contactNumber, password, dob } = req?.body;

    let academicUpdatePromise = Promise.resolve(null);
    let personalUpdatePromise = Promise.resolve(null);

    if (program || classId || sectionId || status) {
        checkFieldAvailablity(req?.body, ["program", "classId", "sectionId", "status"]);
        
        const fields = optionallyUpdateFields(req?.body, ["program", "classId", "sectionId", "status"]);
        
        if (fields.program != undefined && !Types.ObjectId.isValid(fields.program)) throw new ApiError(400, "Invalid program id");

        if(fields.status != undefined) {
            if (!["Active", "Inactive", "Alumni"].includes(fields.status)) {
                throw new ApiError(400, "Invalid status. It must be Active, Inactive or Alumni and should not be an empty string also");
            }
            fields.status = fields.status.trim();
        }

        academicUpdatePromise = await Student.findByIdAndUpdate(
            studentId,
            { $set: fields },
            { new: true }
        ).select("_id");
    }
    
    if (fullName || address || contactNumber || password || dob) {
        checkFieldAvailablity(req?.body, ["fullName", "address", "contactNumber", "password", "dob"]);
        const fields = optionallyUpdateFields(req?.body, ["fullName", "address", "contactNumber", "password", "dob"]);

        for(const key in fields) {
            if(fields[key] != undefined) {
                fields[key] = fields[key].trim();
            }
        }

        if (fields.contactNumber != undefined) {
            const phoneNumberTest = validatePhoneNumber(contactNumber);
            if (!phoneNumberTest.isValid) throw new ApiError(400, phoneNumberTest.message);
        }

        if (fields.password != undefined) {
            const passwordTest = validatePassword(password);
            if (!passwordTest.isValid) throw new ApiError(400, passwordTest.message);
            fields.password = encryptPassword(password);
        }

        if (fields.dob != undefined) {
            fields.dob = new Date(fields.dob);
        }

        personalUpdatePromise = await User.findByIdAndUpdate(
            studentId,
            { $set: fields },
            { new: true }
        ).select("_id");
    }
    
    try {
        const updateResponse = await Promise.all([academicUpdatePromise, personalUpdatePromise]);
        if (updateResponse[0] === null && updateResponse[1] === null) throw new ApiError(400, "No fields to update");
        if (updateResponse) {
            return res
                .status(200)
                .json(new ApiResponse(200, "Student details updated successfully"));
        }
    } catch (error) {
        throw new ApiError(500, error?.message || "Error getting the fields to update properly. Please try again later!");
    }

    const updatedStudent = await User.aggregate([
        {
            $match: { _id: new Types.ObjectId(studentId) }
        },
        {
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "_id",
                as: "academicDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "classes",
                            localField: "classId",
                            foreignField: "_id",
                            as: "classDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$classDetails" },
                    {
                        $lookup: {
                            from: "sections",
                            localField: "sectionId",
                            foreignField: "_id",
                            as: "sectionDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$sectionDetails" },
                    {
                        $lookup: {
                            from: "programs",
                            localField: "program",
                            foreignField: "_id",
                            as: "programDetails",
                            pipeline: [
                                { $project: { name: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$programDetails" },
                    {
                        $addFields: {
                            program: "$programDetails.name",
                            class: "$classDetails.name",
                            section: "$sectionDetails.name",
                        }
                    },
                ]
            }
        },
        { $unwind: "$academicDetails" },
        {
            $project: {
                role: 0,
                updatedAt: 0,
                refreshToken: 0,
                password: 0,
                __v: 0,
                "academicDetails.feeDetails": 0,
                "academicDetails.classId": 0,
                "academicDetails.sectionId": 0,
                "academicDetails.classDetails": 0,
                "academicDetails.sectionDetails": 0,
                "academicDetails.programDetails": 0,
                "academicDetails._id": 0,
                "academicDetails.__v": 0,
                "academicDetails.createdAt": 0,
                "academicDetails.updatedAt": 0,
            }
        }
    ]);
    
    if (!updatedStudent[0]) throw new ApiError(500, "Error updating student");

    updatedStudent[0].dob = moment(updatedStudent[0].dob).format("DD-MM-YYYY");
    updatedStudent[0].createdAt = moment(updatedStudent[0].createdAt).format("DD-MM-YYYY");

    updatedStudent[0] = {
        ...updatedStudent[0],
        ...updatedStudent[0].academicDetails
    }

    delete updatedStudent[0].academicDetails;

    return res
        .status(200)
        .json(new ApiResponse(200, "Student updated successfully", updatedStudent[0]));

});

const updateStdFee = asyncHandler(async (req, res) => {
    const { studentId } = req?.params;
    validateRequiredFields(req?.params, ["studentId"]);
    if (!Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid student id");

    const {
        scholorShip, // INDEPENDENT
        extraSemFee, // Whole object entry -- (Array)
        semToUpdate // Whole object entry of entry to be update -- (Array)
    } = req?.body;

    //console.log(req?.body);

    checkFieldAvailablity(req?.body, ["scholorShip", "extraSemFee", "semToUpdate"]);

    const std = await Student.findById(studentId).select("_id feeDetails");

    if (scholorShip != undefined) {
        if (typeof scholorShip !== "number") throw new ApiError(400, "Scholorship must be a number");

        // Extract current values
        const currentTotalFee = std.feeDetails.totalFee;
        const currentScholorShip = std.feeDetails.scholorShip || 0; // Default to 0 if undefined

        // Calculate the original total fee
        let originalTotalFee;
        if (currentScholorShip === 0) {
            originalTotalFee = currentTotalFee;
        } else if (currentScholorShip === 100) {
            throw new ApiError(400, "Cannot update scholarship from 100% without original fee data");
        } else {
            originalTotalFee = currentTotalFee / (1 - currentScholorShip / 100);
        }

        // Apply the new scholarship to the original total fee
        const newTotalFee = originalTotalFee * (1 - scholorShip / 100);

        // Update feeDetails with the new values
        std.feeDetails.scholorShip = scholorShip;
        std.feeDetails.totalFee = newTotalFee;

        // Update unpaid tuition semester fees based on the new total fee
        std.feeDetails.semesterFees
            .filter((fee) => fee.isTutionFee === true && fee.status === "InActive")
            .map((fee) => (fee.totalFee = Math.floor(newTotalFee / NO_OF_SEMESTERS)));
        

        await std.save({ validateBeforeSave: false });
    }

    if (extraSemFee != undefined) {
        const { feeName, isTutionFee, totalFee, dueDate, status } = extraSemFee;
        validateRequiredFields(extraSemFee, ["feeName", "totalFee"]);

        const newFeeObj = {
            semester: feeName.trim(),
            isTutionFee: isTutionFee || false,
            totalFee: Number(totalFee),
            dueDate: dueDate || "",
            status: status || "Unpaid"
        };
        std.feeDetails.semesterFees.push(newFeeObj);

        await std.save({ validateBeforeSave: false });
    }

    if (semToUpdate != undefined) {
        if (!Array.isArray(semToUpdate)) throw new ApiError(400, "semToUpdate must be an array");

        for (const updateItem of semToUpdate) {
            const { _id, semester, totalFee, status, dueDate, isTutionFee } = updateItem;

            if (!_id) throw new ApiError(400, "Each semToUpdate item must have an _id");

            const feeToUpdate = std.feeDetails.semesterFees.find((fee) => fee._id.toString() === _id);
            const feeDetails = std.feeDetails;

            if (!feeToUpdate) throw new ApiError(404, `Fee with id ${_id} not found`);
            if (!feeDetails) throw new ApiError(404, `Fee with id ${_id} not found in fee details`);

            if (semester !== undefined) feeToUpdate.semester = semester.trim();
            if (totalFee !== undefined) feeToUpdate.totalFee = Number(totalFee);

            if (status !== undefined) {
                const previousStatus = feeToUpdate.status; // Store current status
                feeToUpdate.status = status; // Update to new status
                
                // Ensure fields are valid numbers, default to 0 if undefined
                const totalFee = Number(feeToUpdate.totalFee) || 0;
                feeDetails.paidFee = Number(feeDetails.paidFee) || 0; // Initialize if undefined
                feeDetails.dueFee = Number(feeDetails.dueFee) || 0; // Initialize if undefined
            
                // Handle transitions based on previous and new status
                if (status === "Paid" && previousStatus === "Unpaid") {
                    feeDetails.dueFee = Math.max(0, feeDetails.dueFee - totalFee); // Prevent negative
                    feeDetails.paidFee += totalFee;
                } else if (status === "Unpaid" && previousStatus === "Paid") {
                    // Paid → Unpaid: subtract from paidFee, add to dueFee
                    feeDetails.paidFee = Math.max(0, feeDetails.paidFee - totalFee); // Prevent negative
                    feeDetails.dueFee += totalFee;
                } else if (status === "InActive" && previousStatus === "Paid") {
                    // Paid → InActive: reverse payment, add to dueFee
                    feeDetails.paidFee = Math.max(0, feeDetails.paidFee - totalFee); // Prevent negative

                } else if (status === "InActive" && previousStatus === "Unpaid") {
                    feeDetails.dueFee = Math.max(0, feeDetails.dueFee - totalFee); // Prevent negative
                } else if (status === "Paid" && previousStatus !== "Paid" && previousStatus !== "Unpaid") {
                    feeDetails.paidFee += totalFee;
                } else if (status === "Unpaid" && previousStatus !== "Paid" && previousStatus !== "Unpaid") {
                    feeDetails.dueFee += totalFee;
                }

                /*
                    Agr status arha hai ?
                    -   (Paid) pehlay tha (Unpaid)
                            dueFee mien se minus kr do
                            paidFee mien mien add kr do
                    -   (Unpaid) pehlay tha (Paid)
                            dueFee mien add kr do
                            paidFee mien mien se minus kr do 
                    -   (InActive) pehlay tha (Paid)
                            paidFee mien mien se minus kr do
                    -   (InActive) pehlay tha (Unpaid)
                            dueFee mien mien se minus kr do
                    -   (Paid) pehlay tha (InActive)
                            paidFee mien add kr do
                    -   (Unpaid) pehlay tha (InActive)
                            dueFee mien add kr do
                */
            }

            if (dueDate !== undefined) feeToUpdate.dueDate = dueDate;
            if (isTutionFee !== undefined) feeToUpdate.isTutionFee = isTutionFee || false;
        }

        await std.save({ validateBeforeSave: false });
    }

    std.feeDetails.semesterFees.map((fee) => (fee.dueDate = moment(fee.dueDate).format("DD-MM-YYYY")));
    cache.del(`student-${studentId}`);

    return res
        .status(200)
        .json(new ApiResponse(200, "Fee structure updated successfully", std));
});

const getTeacher = asyncHandler(async (req, res) => {
    const { teacherId } = req?.params;
    validateRequiredFields(req?.params, ["teacherId"]);
    if (!Types.ObjectId.isValid(teacherId)) throw new ApiError(400, "Invalid teacher id");

    if (cache.has(`teacher-${teacherId}`)) {
        const cachedTeacher = cache.get(`teacher-${teacherId}`);
        if (cachedTeacher) {
            return res
                .status(200)
                .json(new ApiResponse(200, "Teacher fetched successfully", cachedTeacher));
        }
    }

    const teacher = await User.aggregate([
        {
            $match: { _id: new Types.ObjectId(teacherId) }
        },
        {
            $lookup: {
                from: "teachers",
                localField: "_id",
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
                        $addFields: {
                            departments: "$departmentsDetails.name" // TODO: REMOVE .name if also want to get hte ids of departments!
                        }
                    },
                    {
                        $project: { departmentsDetails: 0 }
                    }
                ]
            }
        },
        { $unwind: "$teacherDetails" },
        {
            $project: {
                role: 0,
                updatedAt: 0,
                refreshToken: 0,
                __v: 0,
                "teacherDetails._id": 0,
                "teacherDetails.__v": 0,
                "teacherDetails.createdAt": 0,
                "teacherDetails.updatedAt": 0
            }
        }
    ]);

    if (!teacher[0]) throw new ApiError(404, "Something went wrong while fetching teacher's details");

    teacher[0] = {
        ...teacher[0],
        ...teacher[0].teacherDetails
    }

    delete teacher[0].teacherDetails;

    teacher[0].password = decryptPassword(teacher[0].password);
    teacher[0].dob = moment(teacher[0].dob).format("DD-MM-YYYY");
    teacher[0].createdAt = moment(teacher[0].createdAt).format("DD-MM-YYYY");
    cache.set(`teacher-${teacher[0]._id}`, teacher[0]);

    return res
        .status(200)
        .json(new ApiResponse(200, "Teacher fetched successfully", teacher[0]));
});

const updateTeacherDetails = asyncHandler(async (req, res) => {
    try {
		const { teacherId } = req?.params;
		validateRequiredFields(req?.params, ["teacherId"]);
		if (!Types.ObjectId.isValid(teacherId)) throw new ApiError(400, "Invalid teacher id");

		const { fullName, status, address, contactNumber, departments, password } = req?.body;

		// Update basic fields (fullName, address, contactNumber, password)
		if (fullName || address || contactNumber || password) {
			checkFieldAvailablity(req?.body, ["fullName", "address", "contactNumber", "password"]);
			const fields = optionallyUpdateFields(req?.body, ["fullName", "address", "contactNumber", "password"]);

			for (const field in fields) {
				fields[field] = fields[field].trim();
			}

			if (fields.contactNumber != undefined) {
				const phoneNumberTest = validatePhoneNumber(contactNumber);
				if (!phoneNumberTest.isValid) throw new ApiError(400, phoneNumberTest.message);
			}

			if (fields.password != undefined) {
				credentialsValidations({ password: fields.password });
				fields.password = encryptPassword(fields.password);
			}

			const res = await User.findOneAndUpdate({ _id: teacherId }, { $set: fields }, { new: true })
				.select("_id")
				.lean();

			if (!res) throw new ApiError(500, "Error updating teacher");
		}

		// Update departments and status
		if (departments || status) {
			checkFieldAvailablity(req?.body, ["departments", "status"]);

			let updatedFields = {};

			// Handle status update
			if (status != undefined) {
				updatedFields.status = status.trim();
			}

			// Handle departments update
			if (departments != undefined) {
				// Validate department IDs
				departments.forEach((deptId) => {
					if (!Types.ObjectId.isValid(deptId)) {
						throw new ApiError(400, `Invalid department ID: ${deptId}`);
					}
				});

				// Directly set the new list of departments
				updatedFields.departments = departments.map((deptId) => deptId.trim());
			}

			const res = await Teacher.findOneAndUpdate({ _id: teacherId }, { $set: updatedFields }, { new: true })
				.select("_id")
				.lean();

			if (!res) throw new ApiError(500, "Error updating teacher");
		}

		// Fetch updated teacher details
		const updatedTeacher = await User.aggregate([
			{
				$match: { _id: new Types.ObjectId(teacherId) },
			},
			{
				$lookup: {
					from: "teachers",
					localField: "_id",
					foreignField: "_id",
					as: "teacherDetails",
					pipeline: [
						{
							$lookup: {
								from: "departments",
								localField: "departments",
								foreignField: "_id",
								as: "departmentsDetails",
								pipeline: [{ $project: { name: 1 } }],
							},
						},
						{
							$addFields: {
								departments: "$departmentsDetails.name",
							},
						},
						{
							$project: { departmentsDetails: 0 },
						},
					],
				},
			},
			{ $unwind: "$teacherDetails" },
			{
				$project: {
					role: 0,
					password: 0,
					updatedAt: 0,
					refreshToken: 0,
					__v: 0,
					"teacherDetails._id": 0,
					"teacherDetails.__v": 0,
					"teacherDetails.createdAt": 0,
					"teacherDetails.updatedAt": 0,
				},
			},
		]);

		if (!updatedTeacher[0]) throw new ApiError(404, "Something went wrong while fetching teacher's details");

		updatedTeacher[0] = {
			...updatedTeacher[0],
			...updatedTeacher[0].teacherDetails,
		};

		delete updatedTeacher[0].teacherDetails;

		updatedTeacher[0].dob = moment(updatedTeacher[0].dob).format("DD-MM-YYYY");
		updatedTeacher[0].createdAt = moment(updatedTeacher[0].createdAt).format("DD-MM-YYYY");

		cache.del(`teacher-${teacherId}`);

		return res.status(200).json(new ApiResponse(200, "Teacher updated successfully", updatedTeacher[0]));
	} catch (error) {
		console.error(error);
		cache.del(`teacher-${req.params.teacherId}`);
		throw error;
	}
});

const updateTeacherSalaryDetails = asyncHandler(async (req, res) => {
    const { teacherId } = req?.params;
    
    // Validate teacherId
    if (!teacherId || !Types.ObjectId.isValid(teacherId)) {
        throw new ApiError(400, "Invalid or missing teacher ID");
    }

    const { baseSalary, bonusesToAdd, bonusesToRemove, deductionsToAdd, deductionsToRemove } = req?.body;

    // Validation
    if (baseSalary !== undefined && (typeof baseSalary !== 'number' || baseSalary < 0)) {
        throw new ApiError(400, "Base salary must be a non-negative number");
    }

    if (bonusesToAdd) {
        if (!Array.isArray(bonusesToAdd)) {
            throw new ApiError(400, "bonusesToAdd must be an array");
        }
        bonusesToAdd.forEach((bonus, index) => {
            if (!bonus.amount || typeof bonus.amount !== 'number' || bonus.amount <= 0) {
                throw new ApiError(400, `Bonus at index ${index}: Amount must be a positive number`);
            }
            if (!bonus.reason || typeof bonus.reason !== 'string' || !bonus.reason.trim()) {
                throw new ApiError(400, `Bonus at index ${index}: Reason is required and must be a non-empty string`);
            }
            if (!bonus.date || !isValidDate(bonus.date)) {
                throw new ApiError(400, `Bonus at index ${index}: Date must be valid`);
            }
        });
    }

    if (bonusesToRemove) {
        if (!Array.isArray(bonusesToRemove)) {
            throw new ApiError(400, "bonusesToRemove must be an array");
        }
        bonusesToRemove.forEach((id, index) => {
            if (!Types.ObjectId.isValid(id)) {
                throw new ApiError(400, `bonusesToRemove at index ${index}: Invalid bonus ID`);
            }
        });
    }

    if (deductionsToAdd) {
        if (!Array.isArray(deductionsToAdd)) {
            throw new ApiError(400, "deductionsToAdd must be an array");
        }
        deductionsToAdd.forEach((deduction, index) => {
            if (!deduction.amount || typeof deduction.amount !== 'number' || deduction.amount <= 0) {
                throw new ApiError(400, `Deduction at index ${index}: Amount must be a positive number`);
            }
            if (!deduction.reason.trim() || typeof deduction.reason !== 'string') {
                throw new ApiError(400, `Deduction at index ${index}: Reason is required and must be a non-empty string`);
            }
            if (!deduction.date || !isValidDate(deduction.date)) {
                throw new ApiError(400, `Deduction at index ${index}: Date must be valid`);
            }
        });
    }

    if (deductionsToRemove) {
        if (!Array.isArray(deductionsToRemove)) {
            throw new ApiError(400, "deductionsToRemove must be an array");
        }
        deductionsToRemove.forEach((id, index) => {
            if (!Types.ObjectId.isValid(id)) {
                throw new ApiError(400, `deductionsToRemove at index ${index}: Invalid deduction ID`);
            }
        });
    }

    // Check if any update is provided
    if (!baseSalary && !bonusesToAdd && !bonusesToRemove && !deductionsToAdd && !deductionsToRemove) {
        throw new ApiError(400, "No fields provided for update");
    }

    // Build update operations
    const updateOps = {};

    if (baseSalary !== undefined) {
        updateOps.$set = { "salaryDetails.baseSalary": Number(baseSalary) };
    }

    if (bonusesToAdd?.length > 0) {
        updateOps.$push = {
            "salaryDetails.bonuses": {
                $each: bonusesToAdd.map(bonus => ({
                    amount: Number(bonus.amount),
                    reason: bonus.reason.trim(),
                    date: bonus.date.trim()
                }))
            }
        };
    }

    if (bonusesToRemove?.length > 0) {
        updateOps.$pull = {
            "salaryDetails.bonuses": { _id: { $in: bonusesToRemove.map(id => new Types.ObjectId(id)) } }
        };
    }

    if (deductionsToAdd?.length > 0) {
        updateOps.$push = updateOps.$push || {};
        updateOps.$push["salaryDetails.deductions"] = {
            $each: deductionsToAdd.map(deduction => ({
                amount: Number(deduction.amount),
                reason: deduction.reason.trim(),
                date: deduction.date.trim()
            }))
        };
    }

    if (deductionsToRemove?.length > 0) {
        updateOps.$pull = updateOps.$pull || {};
        updateOps.$pull["salaryDetails.deductions"] = {
            _id: { $in: deductionsToRemove.map(id => new Types.ObjectId(id)) }
        };
    }

    console.log(updateOps);
    // return;
    // Execute update
    const updatedTeacher = await Teacher.findOneAndUpdate(
        { _id: teacherId },
        updateOps,
        { new: true }
    ).select("_id salaryDetails").lean();

    if (!updatedTeacher) {
        throw new ApiError(500, "Failed to update teacher salary details");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Teacher salary details updated successfully", updatedTeacher)
    );
});

const updateAdminDetails = asyncHandler(async (req, res) => {
    const { adminId } = req?.params;
    validateRequiredFields(req?.params, ["adminId"]);
    if (!Types.ObjectId.isValid(adminId)) throw new ApiError(400, "Invalid admin id");

    const { fullName, contactNumber, address, password } = req?.body;

    checkFieldAvailablity(req?.body, ["fullName", "contactNumber", "address", "password"]);

    const fields = optionallyUpdateFields(req?.body, ["fullName", "contactNumber", "address", "password"]);

    for (const key in fields) {
       fields[key] = fields[key].trim();
    }
    
    if (fields.contactNumber != undefined) {
        credentialsValidations({ contactNumber: fields.contactNumber });
    }

    if (fields.password != undefined) {
        credentialsValidations({ password: fields.password });
        fields.password = encryptPassword(fields.password);
    }

    const updatedAdmin = await User.findOneAndUpdate(
        { _id: adminId, role: req?.user?.role._id },
        fields,
        { new: true }
    ).select("_id fullName address contactNumber").lean();

    if (!updatedAdmin) throw new ApiError(500, "Error updating admin");

    return res
        .status(200)
        .json(new ApiResponse(200, "Admin updated successfully", updatedAdmin));
});

const updateStaffMemeberDetails = asyncHandler(async (req, res) => {
    const { staffId } = req?.params;
    validateRequiredFields(req?.params, ["staffId"]);
    if (!Types.ObjectId.isValid(staffId)) throw new ApiError(400, "Invalid staff member id");

    const { fullName, contactNumber, address, password } = req?.body;

    checkFieldAvailablity(req?.body, ["fullName", "contactNumber", "address", "password"]);

    const fields = optionallyUpdateFields(req?.body, ["fullName", "contactNumber", "address", "password"]);

    for (const key in fields) {
       fields[key] = fields[key].trim();
    }
    
    if (fields.contactNumber != undefined) {
        credentialsValidations({ contactNumber: fields.contactNumber });
    }

    if (fields.password != undefined) {
        credentialsValidations({ password: fields.password });
        fields.password = encryptPassword(fields.password);
    }

    const updatedStaff = await User.findOneAndUpdate(
        { _id: staffId },
        fields,
        { new: true }
    ).select("_id fullName address contactNumber").lean();

    if (!updatedStaff) throw new ApiError(500, "Error updating staff member");

    return res
        .status(200)
        .json(new ApiResponse(200, "Staff member updated successfully", updatedStaff));
});


// 💀⚡💀⚡💀⚡💀⚡💀⚡💀⚡💀⚡
const deleteStudent = asyncHandler(async (req, res) => {
    const { studentId } = req?.params;
    validateRequiredFields(req?.params, ["studentId"]);
    if (!Types.ObjectId.isValid(studentId)) throw new ApiError(400, "Invalid student id");

    const deletedUser = await User.findOneAndDelete({ _id: studentId });
    if (!deletedUser) throw new ApiError(500, "Error deleting student");
    console.log(deletedUser);
    
    const deletedStudentInstance = await Student.findOneAndDelete({ _id: studentId });
    if (!deletedStudentInstance) throw new ApiError(500, "Error deleting student");
    console.log(deletedStudentInstance);

    return res
        .status(200)
        .json(new ApiResponse(200, "Student deleted successfully"));
})

export {
    addStudent,
    addNewAdmin,
    addTeacher,
    getAllTeachers,
    getAllAdmins,
    getAllStudents,
    loginStudent,
    loginTeacher,
    loginAdmin,
    logoutUser,
    getCurrentUser,
    getStudent,
    updateUserPassword,
    updateStdDetails,
    updateStdFee,
    updateTeacherDetails,
    updateTeacherSalaryDetails,
    getTeacher,
    updateAdminDetails,
    addNewStaffMember,
    updateStaffMemeberDetails,
    getAllStaffMembers,
    loginStaffMember,
    removeAdmin,
    getBulkSampleStudents,
    addStudentsInBulk,
    deleteStudent
};