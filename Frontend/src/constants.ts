class Roles {
    readonly student = "student";
    readonly teacher = "teacher";
    readonly admin = "admin";
    readonly staff = "staff";
}

export const roles = new Roles();

export const AdminPageNames: Record<string, string> = {
    "/dashboard/admin/home": "My Dashboard",
    "/dashboard/admin/classes": "Study Entities",
    "/dashboard/admin/students": "Students",
    "/dashboard/admin/teachers": "Teachers",
    "/dashboard/admin/departments": "Departments",
    "/dashboard/admin/faculty": "Faculty",
    "/dashboard/admin/timetable": "Timetables",
    "/dashboard/admin/attendance/teachers": "Teachers Attendance",
    "/dashboard/admin/attendance/students": "Students Attendance",
};

export const TeacherPageNames: Record<string, string> = {
    "/dashboard/teacher/home": "My Dashboard",
    "/dashboard/teacher/timetable": "Timetables",
    "/dashboard/teacher/attendance/teachers": "Attendance",
    "/dashboard/teacher/attendance/students": "Attendance",
};

export const StaffPageNames: Record<string, string> = {
    "/dashboard/admin/students": "Students",
    "/dashboard/admin/timetable": "Timetables",
    "/dashboard/admin/attendance/teachers": "Teachers Attendance",
    "/dashboard/admin/attendance/students": "Students Attendance",
};

export const StudentPageNames: Record<string, string> = {
    "/dashboard/teacher/timetable": "Timetable",
};

export const PI_CHART_COLORS = ["#0088FE", "#FF8042", "#FFBB28", "#808080"];