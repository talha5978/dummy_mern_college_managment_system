import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Types } from "mongoose";
import { roles } from "../constants.js";
import { getRoleId } from "../controllers/roles.controller.js";
import moment from "moment";
import { cacheService as cache } from "../utils/cacheService.js";
import { generateDecodedToken } from "../utils/helpers.js"

const verifyJWT = asyncHandler(async (req, res, next) => {
	try {
		// Extract access token from cookies or Authorization header
		const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
		if (!token) {
			throw new ApiError(401, "Unauthorized request. No token provided.");
		}

		// Cookie options for setting tokens
		const cookieOptions = {
			httpOnly: true,
			secure: true,
		};

		// Attempt to decode the access token
		let decodedToken;
		const { err: accessErr, decoded } = await generateDecodedToken(token, process.env.ACCESS_TOKEN_SECRET);

		if (accessErr) {
			if (accessErr.name === "TokenExpiredError") {
				// Access token expired, proceed with refresh token
				const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
				if (!refreshToken) {
					throw new ApiError(401, "Refresh token not provided.");
				}

				// Verify the refresh token
				const { err: refreshErr, decoded: decodedRefreshToken } = await generateDecodedToken(
					refreshToken,
					process.env.REFRESH_TOKEN_SECRET
				);

				let user;

				if (refreshErr) {
					if (refreshErr.name === "TokenExpiredError") {
						// Refresh token expired, fetch user and generate new refresh token
						user = await User.findById(decodedRefreshToken?._id);
						if (!user) {
							throw new ApiError(404, "User not found for expired refresh token.");
						}

						const newRefreshToken = await user.generateRefreshToken();
						res.cookie("refreshToken", newRefreshToken, cookieOptions);
						// Update decodedRefreshToken with the new token's data if needed
						const { decoded: newDecodedRefresh } = await generateDecodedToken(
							newRefreshToken,
							process.env.REFRESH_TOKEN_SECRET
						);
						decodedToken = newDecodedRefresh;
                        cache.del(`student-${decodedToken._id}`);
					} else {
						throw new ApiError(401, "Invalid refresh token.");
					}
				} else {
					// Refresh token is valid, fetch user
					user = await User.findById(decodedRefreshToken._id);
					if (!user || !user._id.equals(decodedRefreshToken._id)) {
						throw new ApiError(401, "Refresh token is not valid.");
					}
					decodedToken = decodedRefreshToken;
				}

				// Generate and set new access token
				const newAccessToken = await user.generateAccessToken();
				res.cookie("accessToken", newAccessToken, cookieOptions);

				// Decode the new access token
				const { err: newTokenErr, decoded: newDecodedToken } = await generateDecodedToken(
					newAccessToken,
					process.env.ACCESS_TOKEN_SECRET
				);
				if (newTokenErr) {
					throw new ApiError(500, "Failed to decode new access token.");
				}
				decodedToken = newDecodedToken;
			} else {
				throw new ApiError(401, "Invalid access token.");
			}
		} else {
			// Access token is valid
			decodedToken = decoded;
		}

		// Check cache for user
		const userId = decodedToken._id;
		if (cache.has(`user:${userId}`)) {
			req.user = cache.get(`user:${userId}`);
			console.log("Current Use cache Hit ✔⚡");
			return next();
		}

		// Fetch basic user data
		const basicUser = await User.findById(userId).select("_id role").lean();
		if (!basicUser) {
			throw new ApiError(404, "User not found.");
		}
		// console.log(basicUser);
		let currentUser = {};

		if (basicUser.role.equals(await getRoleId(roles.student))) {
			currentUser = await User.aggregate([
				{
					$match: {
						_id: new Types.ObjectId(basicUser._id),
					},
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
									pipeline: [{ $project: { name: 1 } }],
								},
							},
							{ $unwind: "$classDetails" },
							{
								$lookup: {
									from: "sections",
									localField: "sectionId",
									foreignField: "_id",
									as: "sectionDetails",
									pipeline: [{ $project: { name: 1 } }],
								},
							},
							{ $unwind: "$sectionDetails" },
							{
								$lookup: {
									from: "programs",
									localField: "program",
									foreignField: "_id",
									as: "programDetails",
									pipeline: [{ $project: { name: 1 } }],
								},
							},
							{ $unwind: "$programDetails" },
							{
								$addFields: {
									program: "$programDetails.name",
									class: "$classDetails.name",
									section: "$sectionDetails.name",
								},
							},
						],
					},
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
					},
				},
			]);

			if (!currentUser[0]) throw new ApiError(500, "Something went wrong while logging in student");

			currentUser[0] = {
				...currentUser[0],
				...currentUser[0].studentDetails,
			};

			delete currentUser[0].studentDetails;

			currentUser[0].feeDetails.semesterFees.map(
				(fee) => (fee.dueDate = moment(fee.dueDate).format("DD-MM-YYYY"))
			);

			currentUser[0].dob = moment(currentUser[0].dob).format("DD-MM-YYYY");
			currentUser[0].createdAt = moment(currentUser[0].createdAt).format("DD-MM-YYYY");
			currentUser[0].role = roles.student;
		} else if (basicUser.role.equals(await getRoleId(roles.teacher))) {
			currentUser = await User.aggregate([
				{
					$match: {
						_id: new Types.ObjectId(basicUser._id),
					},
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
									departments: "$departmentsDetails.name", // TODO: REMOVE .name if also want to get hte ids of departments!
								},
							},
							{
								$project: {
									departmentsDetails: 0,
								},
							},
						],
					},
				},
				{
					$unwind: "$teacherDetails",
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
						"teacherDetails.updatedAt": 0,
					},
				},
			]);

			if (!currentUser[0]) throw new ApiError(500, "Something went wrong while logging in teacher");

			currentUser[0] = {
				...currentUser[0],
				...currentUser[0].teacherDetails,
			};

			delete currentUser[0].teacherDetails;

			currentUser[0].dob = moment(currentUser[0].dob).format("DD-MM-YYYY");
			currentUser[0].createdAt = moment(currentUser[0].createdAt).format("DD-MM-YYYY");
			currentUser[0].role = roles.teacher;
		} else if (
			basicUser.role.equals(await getRoleId(roles.admin)) ||
			basicUser.role.equals(await getRoleId(roles.staff))
		) {
			const theUser = await User.findOne({
				_id: basicUser._id,
				role: basicUser.role,
			}).select("-createdAt -updatedAt -__v -role -refreshToken -dob -password");

			currentUser = theUser._doc;

			if (!currentUser) throw new ApiError(404, "Error fetching current user");
			const role = await getRoleId(roles.staff);

			if (basicUser.role.equals(role)) {
				currentUser.role = roles.staff;
			} else {
				currentUser.role = roles.admin;
			}
		} else {
			throw new ApiError(404, "Current user not found");
		}

		req.user = { ...(currentUser[0] || currentUser) };
		cache.set(`user:${decodedToken?._id}`, req.user);
		next();
	} catch (error) {
		throw new ApiError(401, error?.message || "Invalid Access Token");
	}
});

export default verifyJWT;
