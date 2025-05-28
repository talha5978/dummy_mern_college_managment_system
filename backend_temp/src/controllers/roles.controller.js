import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Roles } from "../models/roles.model.js";
import { validateRequiredFields } from "../utils/validations.js";
import { cacheService as cache } from "../utils/cacheService.js";


const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Roles.find().select("-__v -createdAt -updatedAt").sort({ createdAt: -1 });

    if (roles.length === 0) throw new ApiError(404, "Roles not found");

    return res
        .status(200)
        .json(new ApiResponse(200, "Roles fetched successfully", roles));
});

async function getRoleId(roleName) {
    if (cache.has(`${roleName}Id`)) {
        return cache.get(`${roleName}Id`); // Cache Hit
    }
    
    // Cache Miss
    const role = await Roles.findOne({ name: roleName }).select("_id");

    if (!role) throw new Error("Role not found");

    cache.set(`${roleName}Id`, role._id);
    return role._id;
}

const deleteRole = asyncHandler(async (req, res) => {
    throw new ApiError(403, "You are not authorized to delete roles");
    const { roleId } = req.params;
    validateRequiredFields(req?.params, ["roleId"]);
    if (!Types.ObjectId.isValid(roleId)) throw new ApiError(400, "Invalid role id");

    const d = await Roles.findByIdAndDelete(roleId);

    if (!d) throw new ApiError(500, "Error Occurred while deleting role");

    return res
        .status(200)
        .json(new ApiResponse(200, "Role deleted successfully"));
});

const createRole = asyncHandler(async (req, res) => {
    const { name } = req?.body;
    validateRequiredFields(req?.body, ["name"]);
    
    const conflict = await Roles.findOne({ name: name.trim().toLowerCase() }).select("_id");
    if (conflict) throw new ApiError(400, "Role already exists");

    const role = await Roles.create({
        name: name.trim().toLowerCase(),
    });

    if (!role) throw new ApiError(500, "Error Occurred while creating role");
    
    return res
        .status(201)
        .json(new ApiResponse(201, "Role created successfully", role));
});

const updateRole = asyncHandler(async (req, res) => {
    throw new ApiError(403, "You are not authorized to update roles");
    const { name } = req?.body;
    const roleId = req?.params?.roleId;

    validateRequiredFields(req?.body, ["name"]);
    validateRequiredFields(req?.params, ["roleId"]);
    
    if (!Types.ObjectId.isValid(roleId)) throw new ApiError(400, "Invalid role id");

    const role = await Roles.findByIdAndUpdate(
        roleId,
        { name: name.trim().toLowerCase() },
        { new: true }
    );

    if (!role) throw new ApiError(500, "Error Occurred while updating role");
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Role updated successfully", role));
});

export { getAllRoles, deleteRole, createRole, updateRole, getRoleId };