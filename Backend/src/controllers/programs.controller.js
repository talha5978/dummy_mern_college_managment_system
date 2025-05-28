import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Programs } from "../models/programs.model.js";
import { validateRequiredFields } from "../utils/validations.js";

const getAllPrograms = asyncHandler(async (req, res) => {
    const programs = await Programs
        .find()
        .select("-__v -createdAt -updatedAt")
        .sort({ createdAt: -1 });

    if (!programs) throw new ApiError(404, "Programs not found");

    return res
        .status(200)
        .json(new ApiResponse(200, "Programs fetched successfully", programs));
});

const getProgramById = asyncHandler(async (req, res) => {
    const { programId } = req?.params;
    
    validateRequiredFields(req?.params, ["programId"]);
    if (!Types.ObjectId.isValid(programId)) throw new ApiError(400, "Invalid program id");

    const prg = await Programs.aggregate([
        {
            $match: {
                _id: Types.ObjectId(programId)
            }
        },
        {
            $lookup: {
                from: "student",
                localField: "_id",
                foreignField: "program",
                as: "students",
                pipeline: [
                    { $sort: { createdAt: -1 } },
                    {
                        $lookup: {
                            from: "sections",
                            localField: "section",
                            foreignField: "_id",
                            as: "sections",
                            pipeline: [
                                { $sort: { createdAt: -1 } },
                                { $project: { name: 1, _id: 1 } }
                            ]
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

    if (!prg) throw new ApiError(404, "Program not found");

    return res
        .status(200)
        .json(new ApiResponse(200, "Program fetched successfully", prg));
});

const deleteProgram = asyncHandler(async (req, res) => {
    const { programId } = req?.params;
        
    if (!Types.ObjectId.isValid(programId)) throw new ApiError(400, "Invalid program id");

    const resp = await Programs.findByIdAndDelete(programId);
    
    if (!resp) throw new ApiError(404, "Error while deleting program");

    return res
        .status(200)
        .json(new ApiResponse(200, "Program deleted successfully"));
});

const defineProgram = asyncHandler(async (req, res) => {
    const { name } = req?.body;

    await Programs.findOne({ name: name.trim() }).then((program) => {
        if (program) {
            throw new ApiError(400, "Program already exists");
        }
    });

    validateRequiredFields(req?.body, ["name"]);

    const program = await Programs.create({
        name: name.trim(),
    });

    if (!program) throw new ApiError(500, "Error creating program");
    
    return res
        .status(201)
        .json(new ApiResponse(201, "Program created successfully", program));
});

const updateProgram = asyncHandler(async (req, res) => {
    const { name } = req?.body;
    const programId = req?.params?.programId;

    validateRequiredFields(req?.body, ["name"]);
    validateRequiredFields(req?.params, ["programId"]);
    
    if (!Types.ObjectId.isValid(programId)) throw new ApiError(400, "Invalid program id");
    
    const program = await Programs.findByIdAndUpdate(
        programId,
        {
            name: name.trim(),
        },
        { new: true }
    );

    if (!program) throw new ApiError(404, "Error updating program");
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Program updated successfully", program));
});

export { getAllPrograms, deleteProgram, defineProgram, updateProgram, getProgramById };