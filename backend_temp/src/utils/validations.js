import logger from "../logger/winston.logger.js";
import { ApiError } from "./apiError.js";

// Utility to create a consistent validation response
const createValidationResponse = (isValid, message = "") => ({
    isValid,
    message
});

// Validate email with improved regex and detailed feedback
export const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(email)) {
        return createValidationResponse(false, "Invalid email format. Please use a valid email like example@domain.com.");
    }
    return createValidationResponse(true);
};

// Validate password with detailed rules and feedback
export const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z])(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]/;
    if (!regex.test(password)) {
        return createValidationResponse(
            false,
            "Password must be at least 8 characters long, include at least one uppercase letter, one number, and one special character."
        );
    }
    return createValidationResponse(true);
};

// Validate phone number for broader flexibility (e.g., international format) and feedback
export const validatePhoneNumber = (phoneNumber) => {
    const regex = /^\+\d{12}$/;
    if (typeof phoneNumber !== "string" || !regex.test(phoneNumber)) {
        return createValidationResponse(
            false, 
            "Phone number must be a 12-digit numeric string."
        );
    }
    return createValidationResponse(true);
};

export const checkFieldAvailablity = (data, requiredFields) => {
    const presentFields = requiredFields.filter((field) => data[field] !== undefined && data[field] !== null && data[field] !== "");
    if (presentFields.length === 0) {
        throw new ApiError(400, `At least one field must be provided from these fields: ${requiredFields.join(", ")}`);
    }
}

export function isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

/*
    NOTE: USE THIS FORMAY FOR VALIDATION OF REQUIRED FIELDS
    validateRequiredFields(input_data, ["field1", "field2", "field3"]);
*/

export const validateRequiredFields = (data, requiredFields) => {
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length) {
        const msg = `Required field${missingFields.length > 1 ? "s" : ""} missing: ${missingFields.join(", ")}`;
        // logger.warn(msg);
        throw new ApiError(400, msg);
    }

    return true; // Validation Passed 
};

export const optionallyUpdateFields = (updates, allowedFields = []) => {
    let updateObject = {};
    allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
            updateObject[field] = updates[field];
        }
    });

    return updateObject;
}