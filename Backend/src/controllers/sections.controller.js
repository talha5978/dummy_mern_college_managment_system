import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Sections } from "../models/sections.model.js";
import { validateRequiredFields, optionallyUpdateFields, checkFieldAvailablity } from "../utils/validations.js";
import { Student } from "../models/student.model.js";
import { TimeTabels } from "../models/timetables.model.js";

const getAllSections = asyncHandler(async (req, res) => {
    //throw new ApiError(403, "Checking loggers!");
    try {
        const sections = await Sections.find().select("-__v -createdAt -updatedAt").sort({ createdAt: -1 });

        if (!sections) {
            throw new ApiError(404, "Sections not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Sections fetched successfully", sections));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

const deleteSection = asyncHandler(async (req, res) => {
    try {
        const { sectionId } = req?.params;
        
        if (!Types.ObjectId.isValid(sectionId)) {
            throw new ApiError(400, "Invalid section id");
        }

        const student = await Student.findOne({ sectionId: sectionId });

        if (student) {
            throw new ApiError(404, "There should be no student in this section");
        }

        const timetable = await TimeTabels.findOne({ section: sectionId });

        if (timetable) {
            throw new ApiError(404, "There should be no timetable for this section");
        }

        // TODO: CEHCK OTHER POSSIBILITIES FOR THE OCCURENCE OF THE SECTION IN OTHER MODELS E.G EXAMS (FEATURED)
        
        await Sections.findByIdAndDelete(sectionId);
        
        return res
            .status(200)
            .json(new ApiResponse(200, "Section deleted successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

const createSection = asyncHandler(async (req, res) => {
    try {
        const { name, classId } = req?.body;

        validateRequiredFields(req?.body, ["name", "classId"]);

        if (!Types.ObjectId.isValid(classId)) {
            throw new ApiError(400, "Invalid class id");
        }

        if (!Types.ObjectId.isValid(classId)) {
            throw new ApiError(400, "Invalid class id");
        }

        const section = await Sections.create({
            name: name.trim(),
            classId: classId,
        });

        if (!section) {
            throw new ApiError(400, "Error creating section");
        }
        
        return res
            .status(201)
            .json(new ApiResponse(201, "Section created successfully", section));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

const updateSection = asyncHandler(async (req, res) => {
    
    try {
        if (req?.body.length == 0) {
            throw new ApiError(400, "No sections to update");
        }

        req?.body.forEach((section) => {
            validateRequiredFields(section, ["name", "_id"]);
            if (!Types.ObjectId.isValid(section?._id)) {
                throw new ApiError(400, "Invalid section id");
            }
        })
        
        const bulkWriteOperations = req?.body.map((section) => {
            return {
                updateOne: {
                    filter: { _id: section._id },
                    update: { $set: { name: section.name } },
                },
            };
        });


        await Sections.bulkWrite(bulkWriteOperations);
        
        return res
            .status(200)
            .json(new ApiResponse(200, "Section(s) updated successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode, error.message);
    }
});

export { getAllSections, deleteSection, createSection, updateSection };