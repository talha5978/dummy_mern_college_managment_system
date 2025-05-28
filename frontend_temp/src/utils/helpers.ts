import { useLocation, useNavigate } from "react-router";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { ApiError } from "../types/global";
import { toast } from "sonner";
import { roles } from "../constants";

// export const useNavigateToRole = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     // DETAIL:
//     // PEHLAY CHECK KRO K JO URL ENTER KIA HAI KIA WO SADA HAI MEANS ROLE PR END HO RHA HAI YA PHIR ROLE K BAAD "/" HAI YA LOGIN 
//     // AGR HAI? TO RESPECTIVE ROLE K HOME PR NAVIGATE KRO 
//     // AGR NI HAI IN 3NON ME SE KOI :::
//     // To agr jo url enter kia hai wo current role k leye hai to isi url pr navigate kr jao
//     // wrna jo current user logged in hai uskay home pr navigate kr jao

//     function NavigateToRole(userRole: string) {
//         const currentPath = location.pathname.replace(/\/$/, ""); // Remove trailing slash if present
//         const basePath = `/dashboard/${userRole}`;
    
//         // Redirect to the correct home route if the user is on invalid paths
//         if (currentPath === "/" || currentPath === "/login" || currentPath === basePath) {
//             navigate(`/`);
//             return;
//         }
    
//         // Validate role access: Ensure the user is in the correct dashboard
//         const [, dashboard, role] = currentPath.split("/");
//         if (dashboard !== "dashboard" || role !== userRole) {
//             navigate(`*`);
//             return;
//         }
    
//         // Allow navigation within their dashboard
//         navigate(currentPath);
//     }
    
//     return NavigateToRole;
// }



export const useNavigateToRole = () => {
	const navigate = useNavigate();
	const location = useLocation();

	function NavigateToRole(userRole: string) {
		const basePath = `/dashboard/${userRole}`;
		const currentPath = location.pathname;

		// Allow user to stay on any sub-route inside their own role dashboard
		if (currentPath.startsWith(basePath)) return;

		// Allow landing page or login page
		if (currentPath === "" || currentPath === "/" || currentPath === "/login") {
			navigate(`${basePath}/timetable`, { replace: true });
			return;
		}

		// Redirect to 404 if path is outside user's role
		navigate("/404", { replace: true });
	}

	return NavigateToRole;
};

export const getPageName = (pathname: string, PAGE_NAMES: Record<string, string>) => {
    if (pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
    }
    return PAGE_NAMES[pathname] || "Dashboard";
};

// Usefull to tackle the conflict of error with the rtk query 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isApiError = (error: any): error is FetchBaseQueryError & ApiError => {
    return error && "data" in error && typeof error.status === "number";
};

export const mutationToastError = ({
	error,
	message,
	description,
}: {
	error: ApiError;
	message: string;
	description: string;
}) => {
	if (!error.data.success) {
		toast.error(message || "Something went wrong", {
			description: description || "Please try again",
			style: {
				backgroundColor: "var(--destructive-foreground)",
				borderColor: "var(--destructive)",
			},
		});
	}
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FilterEmptyObjectFields = (obj: any) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== "" && value != null)
    );
}

export function isEmptyObject(obj: object) {
    return Object.keys(obj).length === 0;
}

export function giveFilterLimitandPage(obj) {
    const filters = { ...obj };
    delete filters.limit;
    delete filters.page;

    return filters;
}