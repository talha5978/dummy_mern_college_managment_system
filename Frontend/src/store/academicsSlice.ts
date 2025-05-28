import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ClassType, ProgrammeType, TeacherType } from "../types/global.d";

type InitialState = {
	classes: ClassType[];
	programmes: ProgrammeType[];
	teachers: TeacherType[];
}

const initialState: InitialState = {
	classes: [],
	programmes: [],
	teachers: [],
};

const academicsSlice = createSlice({
	name: "academics",
	initialState: initialState,
	reducers: {
		pushClasses: (state: InitialState, action: PayloadAction<ClassType[]>) => {
			const classes = Array.isArray(action.payload) ? action.payload : [action.payload];
			state.classes = classes;
		},
		removeClass: (state: InitialState, action: PayloadAction<string>) => {
			state.classes = state.classes.filter((classItem) => classItem._id !== action.payload);
		},
		addClass: (state: InitialState, action: PayloadAction<ClassType>) => {
			state.classes.push(action.payload);
		},
		pushProgrammes: (state: InitialState, action: PayloadAction<ProgrammeType[]>) => {
			const programmes = Array.isArray(action.payload) ? action.payload : [action.payload];
			state.programmes = programmes;
		},
		removeProgramme: (state: InitialState, action: PayloadAction<string>) => {
			state.programmes = state.programmes.filter((classItem) => classItem._id !== action.payload);
		},
		addProgramme: (state: InitialState, action: PayloadAction<ProgrammeType>) => {
			state.programmes.push(action.payload);
		},
		pushTeachers: (state: InitialState, action: PayloadAction<TeacherType[]>) => {
			const teachers = Array.isArray(action.payload) ? action.payload : [action.payload];
			state.teachers = teachers;
		}
	},
});

export const {
	pushClasses,
	removeClass,
	addClass,
	pushProgrammes,
	removeProgramme,
	addProgramme,
	pushTeachers
} = academicsSlice.actions;
export default academicsSlice.reducer;