import { Student } from "../models/student.model.js";
import {ApiError} from "../utils/apiError.js";

export const getStudentsStats = async (req, res) => {
	try {
		const currentYear = new Date().getFullYear();

		// Step 1: Find the earliest session year
		const earliestSession = await Student.findOne().sort({ sessionYears: 1 }).select("sessionYears");

		if (!earliestSession) {
			throw new ApiError(404, "No student records found");
		}

		// Extract the start year from sessionYears (e.g., "2023-2024" -> 2023)
		const firstSessionYear = parseInt(earliestSession.sessionYears.split("-")[0], 10);

		// Step 2: Compute overall statistics
		const overallStats = await Student.aggregate([
			{
				$group: {
					_id: null,
					active: {
						$sum: {
							$cond: [{ $eq: ["$status", "Active"] }, 1, 0],
						},
					},
					inactive: {
						$sum: {
							$cond: [{ $eq: ["$status", "Inactive"] }, 1, 0],
						},
					},
					alumni: {
						$sum: {
							$cond: [{ $eq: ["$status", "Alumni"] }, 1, 0],
						},
					},
					total: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					active: 1,
					inactive: 1,
					alumni: 1,
					total: 1,
				},
			},
		]);

		const stats = overallStats[0] || { active: 0, inactive: 0, alumni: 0, total: 0 };

		// Step 3: Compute yearly trends
		const yearlyTrends = await Student.aggregate([
			{
				$addFields: {
					sessionStart: { $toInt: { $arrayElemAt: [{ $split: ["$sessionYears", "-"] }, 0] } },
				},
			},
			{
				$group: {
					_id: "$sessionStart",
					active: {
						$sum: {
							$cond: [{ $eq: ["$status", "Active"] }, 1, 0],
						},
					},
					inactive: {
						$sum: {
							$cond: [{ $eq: ["$status", "Inactive"] }, 1, 0],
						},
					},
					alumni: {
						$sum: {
							$cond: [{ $eq: ["$status", "Alumni"] }, 1, 0],
						},
					},
					total: { $sum: 1 },
				},
			},
			{
				$sort: { _id: 1 },
			},
			{
				$project: {
					year: "$_id",
					active: 1,
					inactive: 1,
					alumni: 1,
					total: 1,
					_id: 0,
				},
			},
		]);

		// Step 4: Trends by class
		const classTrends = await Student.aggregate([
			{
				$addFields: {
					sessionStart: { $toInt: { $arrayElemAt: [{ $split: ["$sessionYears", "-"] }, 0] } },
				},
			},
			{
				$group: {
					_id: { classId: "$classId", year: "$sessionStart" },
					total: { $sum: 1 },
				},
			},
			{
				$lookup: {
					from: "classes",
					localField: "_id.classId",
					foreignField: "_id",
					as: "classInfo",
				},
			},
			{
				$unwind: "$classInfo",
			},
			{
				$sort: { "_id.year": 1 },
			},
			{
				$project: {
					class: "$classInfo.name",
					year: "$_id.year",
					total: 1,
					_id: 0,
				},
			},
		]);

		// Step 5: Trends by program
		const programTrends = await Student.aggregate([
			{
				$addFields: {
					sessionStart: { $toInt: { $arrayElemAt: [{ $split: ["$sessionYears", "-"] }, 0] } },
				},
			},
			{
				$group: {
					_id: { program: "$program", year: "$sessionStart" },
					total: { $sum: 1 },
				},
			},
			{
				$lookup: {
					from: "programs",
					localField: "_id.program",
					foreignField: "_id",
					as: "programInfo",
				},
			},
			{
				$unwind: "$programInfo",
			},
			{
				$sort: { "_id.year": 1 },
			},
			{
				$project: {
					program: "$programInfo.name",
					year: "$_id.year",
					total: 1,
					_id: 0,
				},
			},
		]);

		// Step 6: Combine the response
		const response = {
			firstSessionYear,
			overallStats: stats,
			trends: {
				yearly: yearlyTrends,
				byClass: classTrends,
				byProgram: programTrends,
			},
		};

		res.status(200).json({
			success: true,
			data: response,
			message: "Student statistics retrieved successfully",
		});
	} catch (error) {
		console.error(error);
		throw new ApiError(500, "Error retrieving student statistics", error);
	}
};