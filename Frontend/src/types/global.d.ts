// src/types/global.d.ts

declare module "src/components/CompExport" {
    export * from "src/components/CompExport";
}

declare module "src/lib/utils" {
	export * from "src/lib/utils";
}

declare module 'chroma-js';

type RefinedData = {
	[key: string]: string | number
}

export type Bonuses = {
	amount?: number
	reason?: string
	date?: string
	_id?: string
}

export type Deductions = {
	amount?: number
	reason?: string
	date?: string
	_id?: string
}

interface SalaryDetails {
	baseSalary?: number;
	bonuses?: Bonuses[];
	deductions?: Deductions[]
}

interface SemesterFees {
	semester?: number;
	totalFee?: number;
	adjustedFee?: number;
	dueDate?: string;
	status?: string;
	_id?: string;
}

interface feeDetails {
	scholorShip?: number;
	totalFee?: number;
	adjustedFee?: number;
	paidFee?: number;
	dueFee?: number;
	semesterFees?: SemesterFees[]
}
export interface User {
	_id?: string;
	fullName?: string;
	email?: string;
	contactNumber?: string;
	gender?: string;
	address?: string;
	createdAt?: string;
	updatedAt?: string;
	role?: string;
	dob?: string;
	departments?: Array<string>;
	subjectSpecialization?: string;
	salaryDetails?: SalaryDetails;
	status?: string;
	program?: string;
	rollNumber?: number;
	sessionYears?: string;
	class?: string;
	section?: string;
	feeDetails?: feeDetails
}

export interface LoginFormTypes {
	email: string; 
	password: string;
	role?: string;
}

export interface ApiResponse {
	data: unknown,
	errors?: any,
	stack?: any,
	success: boolean,
	statusCode: number,
	message?: string
}
// For use in class page

export type SectionsType = {
	_id: string;
	name: string;
}[]

export interface ClassType {
	_id: string;
	name: string;
	sections: SectionsType;
}

// for use in api
export interface ClassesArray extends ApiResponse {
	data: ClassType[];
}

export interface SingleResponseClassType extends ApiResponse {
	data: ClassType
}
// For current user api in rtk 
export interface CurrUserSession extends ApiResponse {
	data: User
}

export interface LoginSession extends ApiResponse {
	data: { user: User }
}

export interface ApiError {
	data: ApiResponse;
	status: number;
}


export interface NoDataResponseType {
	statusCode: number,
	message: string,
	success: boolean
}

export interface DialogBoxProps<InputData> {
	title?: string;
	description?: string;
	open?: boolean;
	setOpen?: (open: boolean) => !open;
	data?: InputData;
}

export interface ProgrammeType {
	_id: string;
	name: string;
}

// for use in api
export interface ProgrammesArray extends ApiResponse {
	data: ProgrammeType[];
}

export interface StudentType {
	_id: string;
	fullName?: string;
	email?: string;
	password?: string;
	contactNumber?: string;
	gender?: string;
	address?: string;
	createdAt?: string;
	updatedAt?: string;
	role?: string;
	dob?: string;
	status?: string;
	program?: string;
	rollNumber?: number;
	sessionYears?: string;
	class?: string;
	section?: string;
	feeDetails?: feeDetails
}

// for use in api
export interface StudentsResponseArray extends ApiResponse {
	data: {
		pagination: any;
		students: StudentType[];
	};
}

export interface SingleResponseStudentType extends ApiResponse {
	data: StudentType
}

export interface UpdateStudentBasicDetails {
    program?: string;
    classId?: string;
    sectionId?: string;
    status?: string;
    fullName?: string;
    address?: string;
    contactNumber?: number;
    password?: string;
}

export interface StudentsFilter {
	limit?: number;
	page?: number;
	rollNumber?: string;
	fullName?: string;
	gender?: string;
	program?: string;
	status?: string;
	classId?: string;
	sectionId?: string;
	sortBy?: string;
	sortType?: string;
}

export interface TeacherType {
	_id: string;
	fullName?: string;
	email?: string;
	password?: string;
	contactNumber?: string;
	gender?: string;
	dob?: string;
	address?: string;
	createdAt?: string;
	updatedAt?: string;
	departments?: string[];
	subjectSpecialization?: string;
	salaryDetails: {
		baseSalary: number;
		bonuses: Bonuses[];
		deductions: Deductions[];
	}
	status?: string;
	totalSalary?: number; // This is for table data
}

export interface DepartmentType {
	_id: string;
	name?: string;
	headOfDept?: any;
}

// for use in api
export interface DepartmentsResponseArray extends ApiResponse {
	data: {
		pagination: any;
		departments: DepartmentType[];
	};
}

export interface DepartmentsFiler {
	limit?: number;
	page?: number;
}

// for use in api
export interface TeachersResponseArray extends ApiResponse {
	data: {
		pagination: any;
		teachers: TeacherType[];
	};
}

export interface TeachersFilter {
	limit?: number;
	page?: number;
	sortBy?: string;
	filterType?: string;
	sortType?: asc | desc;
	salaryFilterType?: string | undefined | null;
	subjectSpecialization?: string;
	status?: string;
	fullName?: string;
	email?: string;
	gender?: string;
	baseSalary?: number | null;
	departments?: string; // single department
}

export interface SingleResponseTeacherType extends ApiResponse {
	data: TeacherType
}


// TIMETABLES..........
export interface TimetableType {
	_id: string;
	teacher?: string;
	section?: string;
	subject: string;
	day: string;
	timeslot: {
		start: string;
		end: string;
	};
	isOngoing: boolean;
}

// for use in api
export interface TimetablesRespArray extends ApiResponse {
	data: {
		day: string;
		data: TimetableType[];
		isToday: boolean;
	}[];
}
export interface DailyTimetables extends ApiResponse {
	data: TimetableType[]
}


// STUDENTS ATTENDANCE

export interface StudentAttendanceTableEntry {
	_id: string;
	rollNumber: number;
	fullName: string;
	status: string;
	attendence: number;
}

interface stdAttdData {
	overallAttendancePercentage: number;
	data: StudentAttendanceTableEntry[]
}

export interface AllStudentsAttendanceResp extends ApiResponse {
	data: {
		pagination: any;
		data: stdAttdData;
		overallAttendancePercentage: number;
	};
}

export interface StudentAttendanceFilterState {
	limit: number;
	page: number;
	sectionId: string;
}

export interface AttendanceLecture {
	lecture: string;
	status: string;
}

export interface DateLectures {
	[date: string]: AttendanceLecture[];
}

export interface MonthLectures {
	[month: string]: DateLectures;
}

export interface StudentAttendanceResp extends ApiResponse {
	data: {
		totalPresent: number;
		totalAbsent: number;
		totalLeave: number;
		totalHolidays: number;
		overallAttendancePercentage: number;
		monthlyAttendancePercentage: Record<string, number>;
		data: MonthLectures
	};
}


// TEACHER ATTENDANCE
export interface TeacherAttendanceTableEntry {
	_id: string;
	fullName: string;
	attendence: number;
	departments: string[];
	subjectSpecialization: string;
	status: string;
}

export interface AllTeachersAttendanceResp extends ApiResponse {
	data: {
		overallAttendancePercentage: number;
		data: TeacherAttendanceTableEntry[];
		pagination: any;
	};
}

export interface TeacherFORAttendance {
	_id: string;
	fullName: string;
	attendence: number;
	departments: string[];
	subjectSpecialization: string;
	status: string;
	attendanceStatus: "A" | "L" | "P" | "H";
	date: string;
}

export interface TeacherFORAttendanceResponse extends ApiResponse {
	data: TeacherFORAttendance[]
}

export interface TeacherAttendanceMarkData {
	teacherId: string;
	status: "P" | "A" | "L" | "H";
}

export interface MarkTeachersAttendanceApiReq {
	attendenceData: TeacherAttendanceMarkData[]
}

export interface TeacherMonthLectures {
	[month: string]: {
		[date: string]: "P" | "A" | "L" | "H";
	};
}

export interface TeacherAttendanceResp extends ApiResponse {
	data: {
		totalPresent: number;
		totalAbsent: number;
		totalLeave: number;
		totalHolidays: number;
		overallAttendancePercentage: number;
		monthlyAttendancePercentage: Record<string, number>;
		data: TeacherMonthLectures
	};
}


// STUDENTS ATTENDANCE MARKING 

export interface TodaySectionsForAttendanceData {
	subject: string,
	section: {
		_id: string
		name: string
	}
}

export interface TodaySectionsForAttendanceResp extends ApiResponse {
	data: TodaySectionsForAttendanceData[]
}

export interface StudentMarkingData {
	_id: string;
	rollNumber: number;
	fullName: string;
	attendanceStatus: "A" | "L" | "P" | "H";
	date: string;
}

export interface StudentForAttendanceResponse extends ApiResponse {
	data: StudentMarkingData[]
}

export interface StudentAttendanceMarkData {
	studentId: string;
	status: "P" | "A" | "L" | "H";
}

export interface MarkStudentsAttendanceApiReq {
	subject: string;
	sectionId: string;
	attendenceData: StudentAttendanceMarkData[]
}