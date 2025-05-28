import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authenticationApi } from "../services/authentication.api";
import { academicsApi } from "../services/academics.api";
import { usersApi } from "../services/users.api";
import academicsSlice from "./academicsSlice";
import authSlice from "./authSlice";
import uiSlice from "./uiSlice";
import { timetablesApi } from "../services/timetables.api";
import { attendanceApi } from "../services/attendance.api";

export const store = configureStore({
    reducer: {
        auth: authSlice,
        academics: academicsSlice,
        ui: uiSlice,
        [authenticationApi.reducerPath]: authenticationApi.reducer,
        [academicsApi.reducerPath]: academicsApi.reducer,
        [usersApi.reducerPath]: usersApi.reducer,
        [timetablesApi.reducerPath]: timetablesApi.reducer,
        [attendanceApi.reducerPath]: attendanceApi.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware()
        .concat(authenticationApi.middleware)
        .concat(academicsApi.middleware)
        .concat(usersApi.middleware)
        .concat(timetablesApi.middleware)
        .concat(attendanceApi.middleware)
});

setupListeners(store.dispatch);

export type DispatchType = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;