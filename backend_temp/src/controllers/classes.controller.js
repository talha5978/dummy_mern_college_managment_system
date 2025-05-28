import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Classes } from "../models/classes.model.js";
import { validateRequiredFields } from "../utils/validations.js";
import { Sections } from "../models/sections.model.js";
import { Student } from "../models/student.model.js";
import { cacheService as cache } from "../utils/cacheService.js";

const getAllClasses = asyncHandler(async (req, res) => {
    if (cache.has("classes")) {
        console.log("Classes fetched from cache ⏰⏰⏰");
        
        return res
            .status(200)
            .json(new ApiResponse(200, "Classes fetched successfully", cache.get("classes")));
    }
    try {
        const classes = await Classes.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "sections",
                    localField: "_id",
                    foreignField: "classId",
                    as: "sections",
                    pipeline: [
                        { $sort: { createdAt: -1 } },
                        {
                            $project: {
                                _id: 1,
                                name: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    sections: 1
                }
            }
        ]);

        if (!classes) {
            throw new ApiError(404, "Classes not found");
        }

        cache.set("classes", classes);

        return res
            .status(200)
            .json(new ApiResponse(200, "Classes fetched successfully", classes));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

const getClassById = asyncHandler(async (req, res) => {
    try {
        if (req?.params?.classId === undefined) {
            throw new ApiError(400, "Class id is required");
        }

        if (cache.has(`class-${req?.params?.classId}`)) {
            return res
                .status(200)
                .json(new ApiResponse(200, "Class fetched successfully", cache.get(`class-${req?.params?.classId}`)));
        }

        const cls = await Classes.aggregate([
            {
                $match: {
                    _id: new Types.ObjectId(req?.params?.classId)
                }
            },
            {
                $lookup: {
                    from: "sections",
                    localField: "_id",
                    foreignField: "classId",
                    as: "sections",
                    pipeline: [
                        { $sort: { createdAt: -1 } },
                        {
                            $project: {
                                _id: 1,
                                name: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    sections: 1
                }
            }
        ]);

        if (!cls) {
            throw new ApiError(404, "Class not found");
        }

        cache.set(`class-${req?.params?.classId}`, cls[0]);

        return res
            .status(200)
            .json(new ApiResponse(200, "Class fetched successfully", cls[0]));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

const deleteClass = asyncHandler(async (req, res) => {
    try {
        const { classId } = req?.params;
        
        if (!Types.ObjectId.isValid(classId)) {
            throw new ApiError(400, "Invalid class id");
        }

        const sections = await Sections.findOne({ classId: classId });
        
        if (sections) throw new ApiError(404, "Class has one or more than one sections");

        const student = await Student.findOne({ classId: classId });

        if (student) {
            throw new ApiError(404, "There is one or more than one student in this class");
        }

        const c = await Classes.findByIdAndDelete(classId);

        if (!c) throw new ApiError(404, "Error deleting class");

        cache.del("classes");
        if (cache.has(`class-${classId}`)) {
            cache.del(`class-${classId}`);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Class deleted successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

const createClass = asyncHandler(async (req, res) => {
    try {
        const { name } = req?.body;

        validateRequiredFields(req?.body, ["name"]);
        
        const role = await Classes.create({
            name: name.trim(),
        });

        cache.del("classes");
        
        return res
            .status(201)
            .json(new ApiResponse(201, "Class created successfully", role));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

const updateClass = asyncHandler(async (req, res) => {
    try {
        const { name } = req?.body;
        const classId = req?.params?.classId;

        validateRequiredFields(req?.body, ["name"]);
        validateRequiredFields(req?.params, ["classId"]);
        
        if (!Types.ObjectId.isValid(classId)) {
            throw new ApiError(400, "Invalid class id");
        }

        const Class = await Classes.findByIdAndUpdate(
            classId,
            { name: name.trim() },
            { new: true }
        );

        cache.del("classes");
        if (cache.has(`class-${classId}`)) {
            cache.del(`class-${classId}`);
        }
        
        return res
            .status(200)
            .json(new ApiResponse(200, "Class updated successfully", Class));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

export { getAllClasses, deleteClass, createClass, updateClass, getClassById };