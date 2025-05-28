import fs from "fs";
import { ApiError } from "../utils/apiError.js";
import { Student } from "../models/student.model.js";
import { NO_OF_SEMESTERS, PASS_HASH_SALT_SIZE } from "../constants.js";
import Cryptr from "cryptr";
import { validateEmail, validatePassword, validatePhoneNumber } from "./validations.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const autoGenerateFee = ({ totalMarks, obtainedMarks, totalFee_Input }) => {
	try {
		const percentageVal = Number(((obtainedMarks / totalMarks) * 100).toFixed(0));

		let discount = 0;

		if (percentageVal >= 95) {
			discount = 85;
		} else if (percentageVal >= 80) {
			discount = 60;
		} else if (percentageVal >= 55) {
			discount = 30;
		} else {
			discount = 0;
		}

		const totalFee = totalFee_Input - (totalFee_Input * discount) / 100;
		let semesterFees = [];
		const perSemesterFee = totalFee / NO_OF_SEMESTERS; // Equal split for adjusted fee

		for (let i = 1; i <= NO_OF_SEMESTERS; i++) {
			semesterFees.push({
				semester: `Semester ${i}`,
				totalFee: perSemesterFee,
				isTutionFee: true,
				status: "InActive",
				dueDate: "",
			});
		}

		return {
			discount,
			totalFee,
			semesterFees,
		};
	} catch (error) {
		console.log(error);

		throw new ApiError(500, "Error generating fee for student semesters", error);
	}
};

export const credentialsValidations = ({ email, password, contactNumber }) => {
	if (email) {
		const emailTest = validateEmail(email);
		if (!emailTest.isValid) throw new ApiError(400, emailTest.message);
	}
	if (password) {
		const passwordTest = validatePassword(password);
		if (!passwordTest.isValid) throw new ApiError(400, passwordTest.message);
	}
	if (contactNumber) {
		const phoneNumberTest = validatePhoneNumber(contactNumber);
		if (!phoneNumberTest.isValid) throw new ApiError(400, phoneNumberTest.message);
	}

	return true;
};

export const autoGenerateRollNumber = async () => {
	try {
		const lastStudent = await Student.findOne().sort({ rollNumber: -1 }).select("rollNumber");

		let nextRollNumber;

		if (lastStudent && lastStudent.rollNumber) {
			const currentRollNumber = lastStudent.rollNumber;
			const currentSeries = Math.floor(currentRollNumber / 1000); // Get the series part (e.g., 236)

			if (currentRollNumber % 1000 === 999) {
				nextRollNumber = (currentSeries + 1) * 1000 + 1;
			} else {
				nextRollNumber = currentRollNumber + 1;
			}
		} else {
			nextRollNumber = 211001;
		}

		return nextRollNumber;
	} catch (error) {
		throw new Error("Error generating roll number: " + error.message);
	}
};

export const autoGeneratePassword = async (roll) => {
	try {
		// Generate 3 random uppercase letters
		const randomUppercase = [...Array(3)]
			.map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))) // A-Z
			.join("");

		// Generate 1 random lowercase letter
		const randomLowercase = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z

		// Generate 2 random symbols
		const symbols = "#$&";
		const randomSymbols = [...Array(2)]
			.map(() => symbols[Math.floor(Math.random() * symbols.length)])
			.join("");

		return `${randomUppercase}${randomLowercase}-${roll}-${randomSymbols}`;
	} catch (error) {
		throw new Error("Error generating dynamic password: " + error.message);
	}
};

export function unlinkExcelFile(filepath) {
	try {
		fs.unlinkSync(filepath);
	} catch (err) {
		if (err.code === "ENOENT") {
			console.log(`File ${filepath} does not exist, skipping deletion`);
		} else {
			throw new ApiError(500, "Error deleting file", err);
		}
	}
}

export function formatExcelTime(excelTime) {
	if (typeof excelTime !== "number" || isNaN(excelTime) || excelTime < 0 || excelTime > 1) {
		throw new ApiError(400, "Invalid Excel time value: " + excelTime);
	}

	const hours = Math.floor(excelTime * 24);
	const minutes = Math.floor((excelTime * 24 * 60) % 60);
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);

	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
}

export function encryptPassword(password) {
	try {
		const cryptr = new Cryptr(process.env.PASS_HASH_SECRET, {
			encoding: "base64",
			pbkdf2Iterations: 10000,
			saltLength: PASS_HASH_SALT_SIZE,
		});
		return cryptr.encrypt(password);
	} catch (error) {
		throw new ApiError(500, "Error encrypting password", error);
	}
}

export function decryptPassword(password) {
	try {
		const cryptr = new Cryptr(process.env.PASS_HASH_SECRET, {
			encoding: "base64",
			pbkdf2Iterations: 10000,
			saltLength: PASS_HASH_SALT_SIZE,
		});

		return cryptr.decrypt(password);
	} catch (error) {
		throw new ApiError(500, "Error decrypting password", error);
	}
}

export const generateDecodedToken = async (token, secret) => {
	const { err, decoded } = await jwt.verify(token, secret, function (err, decoded) {
		return { err, decoded };
	});
	return { err, decoded };
};


// export const generateDecodedToken = async (token, secret) => {
// 	const { err, decoded } = await jwt.verify(token, secret, function (err, decoded) {
// 		return { err, decoded };
// 	});

// 	if (err && err.name === "TokenExpiredError") {
// 		const user = await User.findById(decoded._id);

// 		if (!user) {
// 			throw new ApiError(404, "User not found");
// 		}

// 		if (user.refreshToken !== refreshToken) {
// 			throw new ApiError(401, "Refresh Token is not valid");
// 		}

// 		const accessToken = await user.generateAccessToken();

//         user.refreshToken = refreshToken;
//         await user.save({ validateBeforeSave: false });

// 		return { err: null, decoded: jwt.decode(newToken) };
// 	} else {
// 		return { err, decoded };
// 	}
// };