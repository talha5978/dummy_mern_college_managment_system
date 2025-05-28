import { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "./store/authSlice";
import { useGetCurrentUserQuery } from "./services/authentication.api";
import { DispatchType } from "./store/store";
import { Toaster } from "@/components/ui/sonner";
import { useNavigateToRole } from "./utils/helpers";
import { SpinnerLoader } from "./components/CompExport";

export const Layout: React.FC = () => {
	const dispatch: DispatchType = useDispatch();
	const navigate = useNavigate();
	const navigateToRole = useNavigateToRole();
	
	const { data: currentUser, isLoading: isCurrentUserFetching } = useGetCurrentUserQuery(undefined, {
		refetchOnMountOrArgChange: false,
		refetchOnFocus: false,
	});

	const { status: authStatus, userData } = useSelector((state: any) => state.auth);
	
	// useEffect(() => {
	// 	if (currentUser?.success && currentUser.statusCode < 300) {
	// 		console.log(`${currentUser.data.fullName} - ${currentUser.data.role?.toUpperCase()} - Logged In..`);
	// 		dispatch(login(currentUser.data));
	// 	} else {
	// 		dispatch(logout());
	// 	}
	// }, [currentUser, dispatch]);

	useEffect(() => {
		if (currentUser?.success && currentUser.statusCode < 300) {
			if (JSON.stringify(userData) !== JSON.stringify(currentUser.data)) {
				console.log(
					`${currentUser.data.fullName} - ${currentUser.data.role?.toUpperCase()} - Logged In..`
				);
				dispatch(login(currentUser.data));
			}
		} else {
			dispatch(logout());
		}
	}, [currentUser, dispatch, userData]);


	// useEffect(() => {
	// 	if (isCurrentUserFetching) return; // Wait until user fetching is done
		
	// 	if (authStatus && currentUser?.data?.role) {
	// 		navigateToRole(currentUser.data.role);
	// 	} else if (!authStatus && !isCurrentUserFetching && userData == null) {
	// 		navigate("/login");
	// 	}
	// }, [authStatus, isCurrentUserFetching, currentUser, navigate, navigateToRole, userData]);


	const hasNavigatedRef = useRef(false);

	useEffect(() => {
		if (isCurrentUserFetching) return;

		const userRole = currentUser?.data?.role;

		if (authStatus && userRole && !hasNavigatedRef.current) {
			navigateToRole(userRole);
			hasNavigatedRef.current = true;
		} else if (!authStatus && !isCurrentUserFetching && currentUser == null) {
			navigate("/login", { replace: true });
		}
	}, [authStatus, isCurrentUserFetching, currentUser, location.pathname]);


	// TODO: Handle Loading here using || for all loading states
	if (isCurrentUserFetching) {
		return <SpinnerLoader className="min-h-svh"/>
	}

	return (
		<main className="flex-grow">
			<Outlet />
			<Toaster />
		</main>
	);
}