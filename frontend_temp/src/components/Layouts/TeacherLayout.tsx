import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import RoleGuard from "../../utils/RoleGuard";
import { roles, TeacherPageNames } from "../../constants";
import { getPageName } from "../../utils/helpers";
import { ModeToggle } from "../ThemeMode-Toggle";


const SecondaryLayout = () => {
	const location = useLocation();
	const currentPageName = getPageName(location.pathname, TeacherPageNames);
	
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="py-4 flex justify-between">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
                        <h2 className="text-lg font-semibold">{currentPageName}</h2>
					</div>
					<span className="px-4">
						<ModeToggle />
					</span>
				</header>
				<Separator></Separator>
                <section className="px-4 py-5 h-full w-full">
                    <Outlet />
                </section>
			</SidebarInset>
		</SidebarProvider>
	);
};

const TeacherLayout: React.FC = () => {
	return (
		<RoleGuard role={roles.teacher}>
			<SecondaryLayout />
		</RoleGuard>
	);
};

export default TeacherLayout;
