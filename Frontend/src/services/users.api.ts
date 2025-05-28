import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse, SingleResponseStudentType, StudentsResponseArray, UpdateStudentBasicDetails, StudentsFilter, TeachersFilter, TeachersResponseArray, SingleResponseTeacherType } from "../types/global.d";
import { StudentFormDataType, UpdateBasicDetailsFormData } from "../components/StudentForm";
import { TeacherFormDataType } from "../components/TeacherForm";

interface StudentsStatsData extends ApiResponse {
	data: {
		firstSessionYear: number;
		overallStats : {
			active: number;
			alumni: number;
			inactive: number;
			total: number;
		}
		trends: {
			byClass: unknown[];
			byProgram: unknown[];
			yearly: unknown[];
		}
	}
}

export const usersApi = createApi({
	reducerPath: "usersApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `/api/user`,
	}),
	tagTypes: ["Students", "Students-Stats", "Teachers"],
	endpoints: (builder) => ({
		getStudents: builder.query<StudentsResponseArray, Partial<StudentsFilter>>({
			query: (params) => ({
				url: "/student",
				method: "GET",
				params,
				credentials: "include",
			}),
			providesTags: ["Students"],
		}),
		addStudent: builder.mutation<SingleResponseStudentType, StudentFormDataType>({
			query: (data) => ({
				url: "/student",
				method: "POST",
				body: data,
				credentials: "include",
			}),
			invalidatesTags: ["Students"],
		}),
		getStudent: builder.query<SingleResponseStudentType, string>({
			query: (id) => ({
				url: `/student-single/${id}`,
				method: "GET",
				credentials: "include",
			}),
		}),
		updateStdBasicDetails: builder.mutation<
			SingleResponseStudentType,
			{ id: string; data: UpdateStudentBasicDetails }
		>({
			query: ({ id, data }) => ({
				url: `/student/${id}`,
				method: "PATCH",
				body: data,
			}),
			invalidatesTags: ["Students"],
		}),
		updateStdFeeStructure: builder.mutation<
			SingleResponseStudentType,
			{ id: string; data: UpdateBasicDetailsFormData }
		>({
			query: ({ id, data }) => ({
				url: `/student/${id}/fee`,
				method: "PATCH",
				body: data,
			}),
		}),
		addStudentsInBulk: builder.mutation<ApiResponse, FormData>({
			query: (data) => ({
				url: "/bulk/create",
				method: "POST",
				body: data,
				credentials: "include",
			}),
		}),
		fetchStudentsStats: builder.query<StudentsStatsData, void>({
			query: () => ({
				url: "/stats/students",
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["Students-Stats"],
		}),
		getTeachers: builder.query<TeachersResponseArray, Partial<TeachersFilter>>({
			query: (params) => ({
				url: "/teacher",
				method: "GET",
				params,
				credentials: "include",
			}),
			providesTags: ["Teachers"],
		}),
		addTeacher: builder.mutation<SingleResponseTeacherType, TeacherFormDataType>({
			query: (data) => ({
				url: "/teacher",
				method: "POST",
				body: data,
				credentials: "include",
			}),
			invalidatesTags: ["Teachers"],
		}),
		getTeacher: builder.query<SingleResponseTeacherType, string>({
			query: (id) => ({
				url: `/teacher/${id}`,
				method: "GET",
				credentials: "include",
			}),
		}),
		updateTeacherBasicDetails: builder.mutation<
			SingleResponseTeacherType,
			{ id: string; data: any }
		>({
			query: ({ id, data }) => ({
				url: `/teacher/${id}`,
				method: "PATCH",
				body: data,
			}),
			invalidatesTags: ["Teachers"],
		}),
		updateTeacherSalary: builder.mutation<
			SingleResponseTeacherType,
			{ teacherId: string; data: any }
		>({
			query: ({ teacherId, data }) => ({
				url: `/teacher/${teacherId}/salary`,
				method: "PATCH",
				body: data,
			}),
		})
	}),
});

export const {
    useGetStudentsQuery,
	useAddStudentMutation,
    useGetStudentQuery,
    useLazyGetStudentQuery,
    useUpdateStdBasicDetailsMutation,
	useUpdateStdFeeStructureMutation,
	useAddStudentsInBulkMutation,
	useFetchStudentsStatsQuery,
	useGetTeachersQuery,
	useAddTeacherMutation,
	useLazyGetTeacherQuery,
	useUpdateTeacherBasicDetailsMutation,
	useUpdateTeacherSalaryMutation
} = usersApi;