import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse, ClassesArray, DepartmentsFiler, DepartmentsResponseArray, NoDataResponseType, ProgrammesArray } from "../types/global.d";

export const academicsApi = createApi({
	reducerPath: "academicsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `/api`,
	}),
	tagTypes: ["Classes", "Programmes", "Departments"],
	endpoints: (builder) => ({
		getClasses: builder.query<ClassesArray, void>({
			query: () => ({
				url: "/classes",
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["Classes"],
		}),
		deleteClass: builder.mutation<NoDataResponseType, string>({
			query: (id) => ({
				url: `/classes/${id}`,
				method: "DELETE",
				credentials: "include",
			}),
			invalidatesTags: ["Classes"],
		}),
		updateClass: builder.mutation<ApiResponse, { id: string; name: string }>({
			query: ({ id, name }) => ({
				url: `/classes/${id}`,
				method: "PATCH",
				credentials: "include",
				body: { name },
			}),
			invalidatesTags: ["Classes"],
		}),
		updateSections: builder.mutation<
			{
				message: string;
				statusCode: number;
				success: boolean;
			},
			Array<{ id: string; name: string }>
		>({
			query: (body) => ({
				url: `/sections`,
				method: "PATCH",
				credentials: "include",
				body,
			}),
			invalidatesTags: ["Classes"],
		}),
		createSection: builder.mutation<ApiResponse, { classId: string; name: string }>({
			query: ({ classId, name }) => ({
				url: `/sections`,
				method: "POST",
				credentials: "include",
				body: { classId, name },
			}),
			invalidatesTags: ["Classes"],
		}),
		createClass: builder.mutation<ApiResponse, { name: string }>({
			query: ({ name }) => ({
				url: `/classes`,
				method: "POST",
				credentials: "include",
				body: { name },
			}),
			invalidatesTags: ["Classes"],
		}),
		deleteSection: builder.mutation<NoDataResponseType, string>({
			query: (id) => ({
				url: `/sections/${id}`,
				method: "DELETE",
				credentials: "include",
			}),
			invalidatesTags: ["Classes"],
		}),
		getProgrammes: builder.query<ProgrammesArray, void>({
			query: () => ({
				url: "/programs",
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["Programmes"],
		}),
		createProgramme: builder.mutation<ApiResponse, { name: string }>({
			query: ({ name }) => ({
				url: `/programs`,
				method: "POST",
				credentials: "include",
				body: { name },
			}),
			invalidatesTags: ["Programmes"],
		}),
		updateProgramme: builder.mutation<ApiResponse, { id: string; name: string }>({
			query: ({ id, name }) => ({
				url: `/programs/${id}`,
				method: "PATCH",
				credentials: "include",
				body: { name },
			}),
			invalidatesTags: ["Programmes"],
		}),
		deleteProgramme: builder.mutation<NoDataResponseType, string>({
			query: (id) => ({
				url: `/programs/${id}`,
				method: "DELETE",
				credentials: "include",
			}),
			invalidatesTags: ["Programmes"],
		}),
		getDepartments: builder.query<DepartmentsResponseArray, DepartmentsFiler>({
			query: (params) => ({
				url: "/departments",
				method: "GET",
				params,
				credentials: "include",
			}),
			providesTags: ["Departments"],
		}),
		upadateDepartment: builder.mutation<NoDataResponseType, { id: string; data: { name: string, headOfDept: string } }>({
			query: ({ id, data }) => ({
				url: `/departments/${id}`,
				method: "PATCH",
				credentials: "include",
				body: { name: data.name, headOfDept: data.headOfDept ?? null },
			}),
			invalidatesTags: ["Departments"],
		}),
		addDepartment: builder.mutation<ApiResponse, { name: string, headOfDept: string }>({
			query: ({ name, headOfDept }) => ({
				url: "/departments",
				method: "POST",
				credentials: "include",
				body: { name, headOfDept },
			}),
			invalidatesTags: ["Departments"],
		}),
		deleteDepartment: builder.mutation<NoDataResponseType, string>({
			query: (id) => ({
				url: `/departments/${id}`,
				method: "DELETE",
				credentials: "include",
			}),
			invalidatesTags: ["Departments"],
		})
	}),
});

export const {
	useGetClassesQuery,
	useDeleteClassMutation,
	useUpdateClassMutation,
	useUpdateSectionsMutation,
	useCreateSectionMutation,
	useDeleteSectionMutation,
	useCreateClassMutation,
	usePrefetch,
	useGetProgrammesQuery,
	useCreateProgrammeMutation,
	useUpdateProgrammeMutation,
	useDeleteProgrammeMutation,
	useGetDepartmentsQuery,
	useUpadateDepartmentMutation,
	useAddDepartmentMutation,
	useDeleteDepartmentMutation
} = academicsApi;
