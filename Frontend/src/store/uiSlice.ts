import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DepartmentsFiler, DepartmentType, StudentAttendanceFilterState, StudentsFilter, StudentType, TeachersFilter, TeacherType, TimetableType } from "../types/global";
import { TeacherAttendanceFilter } from "../services/attendance.api";

interface UiState {
	dialogeBoxes: Record<string, boolean>;
	studentsFiltersState: StudentsFilter;
	studentDialogData: StudentType | null | undefined;
	departmentDialogData: DepartmentType | null | undefined;
	departmentsFilerState: DepartmentsFiler;
	teacherDialogData: TeacherType | null | undefined;
	teachersFiltersState: TeachersFilter;
	timetableFormData: TimetableType | null | undefined;
	studentsAttendanceFiltersState: StudentAttendanceFilterState;
	teachersAttendanceFiltersState: TeacherAttendanceFilter
}

const initialState: UiState = {
	dialogeBoxes: {},
	studentsFiltersState: {
		limit: 10, // Change this default for tweeks ✔
		page: 1,
		rollNumber: "",
		fullName: "",
		gender: "",
		program: "",
		status: "",
		classId: "",
		sectionId: "",
		sortBy: "",
		sortType: "",
	},
	studentDialogData: null,
	departmentsFilerState: {
		limit: 10, // Change this default for tweeks ✔
		page: 1
	},
	departmentDialogData: null,
	teacherDialogData: null,
	teachersFiltersState: {
        limit: 10, // Change this default for tweeks ✔
		page: 1, 
        sortBy: "", 
        sortType: "", // enum: asc | desc
        filterType: "", // enum: $gte | $lte | $gt | $lt
        subjectSpecialization: "",
        status: "",
        fullName: "",
        email: "",
        gender: "", 
        baseSalary: null,
        departments: "",
	},
	timetableFormData: null,
	studentsAttendanceFiltersState: {
		limit: 20,
		page: 1,
		sectionId: ""
	},
	teachersAttendanceFiltersState: {
		limit: 20,
		page: 1
	}
};

export const stateDialogeBoxes = {
	"classDialogBoxOpen" : "classDialogBoxOpen",
	"programmeDialogeBoxOpen" : "programmeDialogeBoxOpen",
	"studentFilterDialogeBoxOpen" : "studentFilterDialogeBoxOpen",
	"addStudentDialogeBoxOpen" : "addStudentDialogeBoxOpen",
	"bulkAddStudentDialogeBoxOpen" : "bulkAddStudentDialogeBoxOpen",
	"teacherFilterDialogeBoxOpen" : "teacherFilterDialogeBoxOpen",
	"departmentsAddDialogeBoxOpen" : "departmentsAddDialogeBoxOpen",
	"addTeacherDialogeBoxOpen": "addTeacherDialogeBoxOpen",
	"timetableAddDialoge": "timetableAddDialoge",
	"bulkAddTimetableDialogue": "bulkAddTimetableDialogue",
	"timetableUpdateDialoge": "timetableUpdateDialoge",
	"allTimetablesDelDialogue": "allTimetablesDelDialogue"
}

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		openDialog: (state: UiState, action: PayloadAction<string>) => {
			state.dialogeBoxes[action.payload] = true;
		},
		closeDialoge: (state: UiState, action: PayloadAction<string>) => {
			state.dialogeBoxes[action.payload] = false;
		},
		setStudentsFiltersState: (
			state: UiState,
			action: PayloadAction<Partial<StudentsFilter>>
		) => {
			state.studentsFiltersState = {
				...state.studentsFiltersState,
				...action.payload,
				page: 1,
				limit: 10,
			};
		},
		resetStudentsFiltersState: (state: UiState) => {
			state.studentsFiltersState = initialState.studentsFiltersState;
		},
		setStudentsPagination: (
			state: UiState,
			action: PayloadAction<{ page?: number; limit?: number }>
		) => {
			state.studentsFiltersState = {
				...state.studentsFiltersState,
				...(action.payload.page && { page: action.payload.page }),
				...(action.payload.limit && { limit: action.payload.limit }),
			}
		},
		setStudentDialogeData: (state: UiState, action: PayloadAction<StudentType | null | undefined>) => {
			state.studentDialogData = action.payload
		},
		setTeachersFiltersState: (
			state: UiState,
			action: PayloadAction<Partial<TeachersFilter>>
		) => {
			state.teachersFiltersState = {
				...state.teachersFiltersState,
				...action.payload,
				page: 1,
				limit: 10,
			};
		},
		setDepartmentsPagination: (
			state: UiState,
			action: PayloadAction<{ page?: number; limit?: number }>
		) => {
			state.departmentsFilerState = {
				...state.departmentsFilerState,
				...(action.payload.page && { page: action.payload.page }),
				...(action.payload.limit && { limit: action.payload.limit }),
			}
		},
		setDepartmentDialogeData: (state: UiState, action: PayloadAction<DepartmentType | null | undefined>) => {
			state.departmentDialogData = action.payload
		},
		resetTeachersFiltersState: (state: UiState) => {
			state.teachersFiltersState = initialState.teachersFiltersState;
		},
		setTeachersPagination: (
			state: UiState,
			action: PayloadAction<{ page?: number; limit?: number }>
		) => {
			state.teachersFiltersState = {
				...state.teachersFiltersState,
				...(action.payload.page && { page: action.payload.page }),
				...(action.payload.limit && { limit: action.payload.limit }),
			}
		},
		setTeacherDialogeData: (state: UiState, action: PayloadAction<TeacherType | null | undefined>) => {
			state.teacherDialogData = action.payload
		},
		setTimetableFormData: (state: UiState, action: PayloadAction<any>) => {
			state.timetableFormData = action.payload
		},
		setStudentsAttendanceFilter: (
			state: UiState,
			action: PayloadAction<{ page?: number; limit?: number, sectionId?: string }>
		) => {
			state.studentsAttendanceFiltersState = {
				...state.studentsAttendanceFiltersState,
				...(action.payload.page && { page: action.payload.page }),
				...(action.payload.limit && { limit: action.payload.limit }),
				...(action.payload.sectionId && { sectionId: action.payload.sectionId }),
			}
		},
		setTeachersAttendanceFilter: (
			state: UiState,
			action: PayloadAction<{ page?: number; limit?: number }>
		) => {
			state.teachersAttendanceFiltersState = {
				...state.teachersAttendanceFiltersState,
				...(action.payload.page && { page: action.payload.page }),
				...(action.payload.limit && { limit: action.payload.limit })
			}
		},
	},
});

export const {
	openDialog,
	closeDialoge,
	setStudentsFiltersState,
	resetStudentsFiltersState,
	setStudentsPagination,
	setStudentDialogeData,
	setTeachersFiltersState,
	resetTeachersFiltersState,
	setTeachersPagination,
	setDepartmentsPagination,
	setDepartmentDialogeData,
	setTeacherDialogeData,
	setTimetableFormData,
	setStudentsAttendanceFilter,
	setTeachersAttendanceFilter
} = uiSlice.actions;
export default uiSlice.reducer;