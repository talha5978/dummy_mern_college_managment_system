import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types/global.d";

interface AuthState {
	status: boolean | null;
	userData: User | null;
}

const initialState: AuthState = {
	status: null,
	userData: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		login: (state: AuthState, action: PayloadAction<User>) => {
			state.status = true;
			state.userData = action.payload;
		},
		logout: (state: AuthState) => {
			state.status = false;
			state.userData = null;
		},
	},
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
