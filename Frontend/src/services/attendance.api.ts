import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { AllStudentsAttendanceResp, AllTeachersAttendanceResp, MarkStudentsAttendanceApiReq, MarkTeachersAttendanceApiReq, NoDataResponseType, StudentAttendanceFilterState, StudentAttendanceResp, StudentForAttendanceResponse, TeacherAttendanceResp, TeacherFORAttendanceResponse, TodaySectionsForAttendanceResp } from "../types/global.d";

export interface TeacherAttendanceFilter {
	limit: number,
	page: number
}

export const attendanceApi = createApi({
	reducerPath: "attendanceApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `/api/attendence`,
	}),
	tagTypes: [
		"Students-Attendance",
		"Student-Attendance",
		"Teachers-Attendance",
		"Teacher-Attendance",
		"Today-Attendance-For-Teachers",
		"TODAY_SECTIONS",
		"STUDENTS_FOR_ATTENDENCE"
	],
	endpoints: (builder) => ({
		getAllStudentsAttendance: builder.query<AllStudentsAttendanceResp, StudentAttendanceFilterState>({
			query: (input: StudentAttendanceFilterState) => ({
				url: `/all/students/${input.sectionId}`,
				method: "GET",
				params: {
                    limit: input.limit,
                    page: input.page
                },
				credentials: "include",
			}),
			providesTags: ["Students-Attendance"],
		}),
        getStudentAttendance: builder.query<StudentAttendanceResp, string>({
            query: (studentId: string) => ({
                url: `/student/${studentId}`,
				method: "GET",
				credentials: "include",
            }),
			providesTags: ["Student-Attendance"],
        }),
		getAllTeachersAttendance: builder.query<AllTeachersAttendanceResp, Partial<TeacherAttendanceFilter>>({
			query: () => ({
				url: `/all/teachers`,
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["Teachers-Attendance"],
		}),
		getTeachersForAttendance: builder.query<TeacherFORAttendanceResponse, void>({
			query: () => ({
				url: `/teachers-attedance-today`,
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["Today-Attendance-For-Teachers"],
		}),
		markTeachersAttendance: builder.mutation<NoDataResponseType, MarkTeachersAttendanceApiReq>({
			query: (DATA) => ({
				url: `/mark/teachers`,
				method: "POST",
				body: DATA,
				credentials: "include",
			}),
			invalidatesTags: ["Teachers-Attendance", "Today-Attendance-For-Teachers"],
		}),
		getTeacherAttendance: builder.query<TeacherAttendanceResp, string>({
			query: (teacherId) => ({
				url: `/teacher/${teacherId}`,
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["Teacher-Attendance"],
		}),
		
		// Students attendance marking...
		getTodaySectionsForAttendance: builder.query<TodaySectionsForAttendanceResp, void>({
			query: () => ({
				url: `/sections-for-attendence`,
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["TODAY_SECTIONS"],
		}),
		getStudentsForAttendanceMarking: builder.query<StudentForAttendanceResponse, string>({
			query: (sectionId) => ({
				url: `/students-for-attendence/${sectionId}`,
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["STUDENTS_FOR_ATTENDENCE"],
		}),
		markStudentsAttendance: builder.mutation<NoDataResponseType, MarkStudentsAttendanceApiReq>({
			query: (DATA) => ({
				url: `/mark/students`,
				method: "POST",
				body: DATA,
				credentials: "include",
			}),
			invalidatesTags: ["Students-Attendance", "STUDENTS_FOR_ATTENDENCE"],
		}),
	}),
});

export const {
    useGetAllStudentsAttendanceQuery,
	useGetStudentAttendanceQuery,
	useGetAllTeachersAttendanceQuery,
	useGetTeachersForAttendanceQuery,
	useMarkTeachersAttendanceMutation,
	useGetTeacherAttendanceQuery,
	useGetStudentsForAttendanceMarkingQuery,
	useGetTodaySectionsForAttendanceQuery,
	useMarkStudentsAttendanceMutation
} = attendanceApi;