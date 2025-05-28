export const dbName = "college-managment-system";
export const NO_OF_SEMESTERS = 4;

export const roles = {
    get student() { return "student" },
    get teacher() { return "teacher" },
    get admin() { return "admin" },
    get staff() { return "staff" },
    get superAdmin() { return "super-admin" }
}

export const MAX_REQUESTS = 5000;
export const LIMITING_TIME = 15 * 60 * 1000;

// xlsx header styles
export const xlsxSheetHeaderStyles = {
    font: { sz: 14, color: { rgb: "FFFFFF" } }, // White text, bold
    fill: { patternType: "solid", fgColor: { rgb: "2C296D" } }, // Blue background
    alignment: { horizontal: "center", vertical: "center" }
}

// Define data cell styling (black text, light gray background, borders)
export const xlsxSheetDataStyles = {
    font: { sz: 14, color: { rgb: "000000" } }, // Black text
    alignment: { horizontal: "center", vertical: "center" },
    border: {
        top: { style: "thin", fgColor: { rgb: "FFFFFF" } },
        bottom: { style: "thin", fgColor: { rgb: "FFFFFF" } },
        left: { style: "thin", fgColor: { rgb: "FFFFFF" } },
        right: { style: "thin", fgColor: { rgb: "FFFFFF" } }
    }
};

export const PASS_HASH_SALT_SIZE = 10;