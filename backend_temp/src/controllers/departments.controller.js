import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Departments } from "../models/departments.model.js";
import { checkFieldAvailablity, optionallyUpdateFields, validateRequiredFields } from "../utils/validations.js";
import { Teacher } from "../models/teacher.model.js";

const getAllDepartments = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req?.query;

        const aggregationPipeline = [
			{
				$lookup: {
					from: "users",
					localField: "headOfDept",
					foreignField: "_id",
					as: "headOfDept",
					pipeline: [
						{
							$project: {
								_id: 1,
								fullName: 1,
							},
						},
					],
				},
			},
			{
				$unwind: {
                    path: "$headOfDept",
                    preserveNullAndEmptyArrays: true,
                }
			},
			{
				$project: {
					_id: 1,
					name: 1,
					headOfDept: {
                        $ifNull: ["$headOfDept", null]
                    },
				},
			},
			{
				$sort: {
					createdAt: -1,
				},
			},
		];

        const departments = await Departments.aggregatePaginate(
			Departments.aggregate(aggregationPipeline),
			{
				page: Number(page),
				limit: Number(limit)
			}
		);

        if (departments.docs.length == 0) {
            throw new ApiError(404, "Departments not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Departments fetched successfully", {
                departments: departments.docs,
                pagination: {
                    ...departments,
                    docs: undefined
                },
            }));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const deleteDepartment = asyncHandler(async (req, res) => {
    const { departmentId } = req.params;
    
    if (!Types.ObjectId.isValid(departmentId)) {
        throw new ApiError(400, "Invalid department id");
    }

    const teacherConflict = await Teacher.findOne({ departments: departmentId });

    if (teacherConflict) {
        throw new ApiError(400, "Cannot delete department as it is associated with a teacher");
    }

    const d = await Departments.findByIdAndDelete(departmentId);

    if (!d) throw new ApiError(404, "Error deleting department");

    return res
        .status(200)
        .json(new ApiResponse(200, "Department deleted successfully"));
});

const createDepartment = asyncHandler(async (req, res) => {
    const { name, headOfDept } = req?.body;

    validateRequiredFields(req?.body, ["name"]);
    
    const conflict = await Departments.findOne({ name: name.trim().toLowerCase() });
    if(conflict !== null) throw new ApiError(400, "Department with this name already exists");

    const department = await Departments.create({
        name: name.trim(),
        headOfDept: headOfDept || null
    });

    if (!department) throw new ApiError(500, "Error creating department");
    
    return res
        .status(201)
        .json(new ApiResponse(201, "Department created successfully", department));
});

const updateDepartment = asyncHandler(async (req, res) => {
    const departmentId = req?.params?.departmentId;

    validateRequiredFields(req?.params, ["departmentId"]);
    if (!Types.ObjectId.isValid(departmentId)) throw new ApiError(400, "Invalid department id");

    const presentFields = ["name", "headOfDept"].filter(
		(field) => req?.body[field] !== undefined && req?.body[field] !== ""
	);
	if (presentFields.length === 0) {
		throw new ApiError(
			400,
			`At least one field must be provided from these fields: ${requiredFields.join(", ")}`
		);
	}
    
    const fields = optionallyUpdateFields(req?.body, ["name", "headOfDept"]);

    if (fields.headOfDept != undefined) {
        if (!Types.ObjectId.isValid(fields.headOfDept)) {
            throw new ApiError(400, "Invalid head of department id");
        }
    }

    const department = await Departments.findByIdAndUpdate(
        departmentId,
        fields,
        { new: true }
    ).select("-__v -createdAt -updatedAt");

    if (!department) throw new ApiError(500, "Error updating department");

    return res
        .status(200)
        .json(new ApiResponse(200, "Department updated successfully", department));
});

export { getAllDepartments, deleteDepartment, createDepartment, updateDepartment };