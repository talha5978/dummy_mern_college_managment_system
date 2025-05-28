import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TimetablesRespArray, NoDataResponseType, ApiResponse, DailyTimetables } from "../types/global.d";

export interface TimeTableUpdateData {
	_id: string;
	data: {
		subject?: string;
		day?: string;
		teacherId?: string;
		sectionId?: string;
		startTime?: string;
		endTime?: string;
	}
}

export interface TimeTableCreateData {
	teacherId: string;
	subject: string;
	day: string;
	startTime: string;
	endTime: string;
	sectionId: string;
}

interface TimetableFilter {
	week: boolean
}

export const timetablesApi = createApi({
	reducerPath: "timetablesApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `/api/timetables`,
	}),
	tagTypes: ["Timetables", "Teacher-Timetables"],
	endpoints: (builder) => ({
		getAllTimetables: builder.query<TimetablesRespArray, void>({
			query: () => ({
				url: "/all-timetables",
				method: "GET",
				credentials: "include",
			}),
			providesTags: ["Timetables"],
		}),
		deleteTimetableEvent: builder.mutation<NoDataResponseType, string>({
			query: (tID) => ({
				url: `/${tID}`,
				method: "DELETE",
			}),
		}),
		updateTimetableEvent: builder.mutation<NoDataResponseType, TimeTableUpdateData>({
			query: (data) => ({
				url: `/${data._id}`,
				method: "PATCH",
				body: data.data,
			}),
			invalidatesTags: ["Timetables"],
		}),
		createTimetable: builder.mutation<NoDataResponseType, TimeTableCreateData>({
			query: (data) => ({
				url: "/",
				method: "POST",
				body: data,
			}),
			invalidatesTags: ["Timetables"],
		}),
		addTimetableInBulk: builder.mutation<ApiResponse, FormData>({
			query: (data) => ({
				url: "/bulk/create",
				method: "POST",
				body: data,
			}),
		}),
		delTimetable: builder.mutation<NoDataResponseType, string>({
			query: (tID) => ({
				url: `/${tID}`,
				method: "DELETE",
			}),
			invalidatesTags: ["Timetables"],
		}),
		delAllTimetables: builder.mutation<NoDataResponseType, void>({
			query: () => ({
				url: "/all-timetables",
				method: "DELETE",
			}),
			invalidatesTags: ["Timetables"],
		}),
		getUserTimetables: builder.query<TimetablesRespArray & DailyTimetables, TimetableFilter>({
			query: (params) => ({
				url: "/",
				method: "GET",
				params,
				credentials: "include",
			}),
			providesTags: ["Teacher-Timetables"]
		}),
	}),
});

export const {
    useGetAllTimetablesQuery,
    useDeleteTimetableEventMutation,
	useUpdateTimetableEventMutation,
	useCreateTimetableMutation,
	useAddTimetableInBulkMutation,
	useDelTimetableMutation,
	useDelAllTimetablesMutation,
	useGetUserTimetablesQuery
} = timetablesApi;