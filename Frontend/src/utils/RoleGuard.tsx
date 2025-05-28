import { useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { RootState } from "../store/store";

interface RoleGuardProps {
	role: string;
	children: React.ReactNode;
}

const RoleGuard = ({ role, children }: RoleGuardProps): React.ReactNode => {
	const user = useSelector((state: RootState) => state.auth.userData);
	
	useEffect(() => {
		if(user === null) return;

		if (!user || user.role !== role) {
			toast.error("Redirect Error", {
				description: "You are not authorized to view this page",
				style: {
					backgroundColor: "var(--destructive-foreground)",
					borderColor: "var(--destructive)",
				}
			});
		}
	}, [user, role]);

	// If user is not authorized, return null to prevent rendering unauthorized content
	if (!user || user.role !== role) {
		return null; // 👈 Prevents unauthorized page flash before redirect
	}

	return children;
};

export default RoleGuard;
