import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { LoginSession, CurrUserSession } from "../types/global.d";
import { LoginFormTypes, NoDataResponseType } from "../types/global.d";

export const authenticationApi = createApi({
	reducerPath: "authenticationApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `/api/user`,
	}),
	tagTypes: ["User"],
	endpoints: (builder) => ({
		login: builder.mutation<LoginSession, LoginFormTypes>({
			query: (data) => {
				return {
					url: `/login-${data.role}`,
					method: "POST",
					body: {
						email: data.email,
						password: data.password,
					},
					credentials: "include",
				};
			},
			invalidatesTags: ['User']
		}),
		getCurrentUser: builder.query<CurrUserSession, void>({
			query: () => ({
				url: "/current-user",
				method: "GET",
				credentials: "include",
			}),
			providesTags: ['User'] // For caching
		}),
		logout: builder.mutation<NoDataResponseType, void>({
			query: () => ({
				url: "/logout",
				method: "POST",
				credentials: "include",
			}),
			invalidatesTags: ['User']
		}),
	}),
});

export const {
	useLoginMutation,
	useGetCurrentUserQuery,
	useLogoutMutation,
} = authenticationApi;
