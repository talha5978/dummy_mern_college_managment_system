import * as React from "react";
import {
	BookMarkedIcon,
	BookOpen,
	Command,
	GraduationCap,
	Home,
	Hotel,
	LifeBuoy,
	Send,
	TimerIcon,
	User2,
	UserCog2Icon,
	UserRoundPenIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSelector } from "react-redux";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const userData = useSelector((state: any) => state.auth.userData);
	
	const SIDEBAR_ITEMS: any = {
		admin: {
			user: {
				name: userData.fullName,
				email: userData.email,
				icon: User2,
			},
			navItems: [
				{
					title: "Students",
					url: "/dashboard/admin/students",
					icon: GraduationCap,
				},
				{
					title: "Teachers",
					url: "/dashboard/admin/teachers",
					icon: UserRoundPenIcon,
				},
				{
					title: "Faculty",
					url: "/dashboard/admin/faculty",
					icon: UserCog2Icon,
				},
				{
					title: "Timetables",
					url: "/dashboard/admin/timetable",
					icon: TimerIcon,
				},
				{
					title: "Attendence",
					url: "#",
					icon: BookMarkedIcon,
					items: [
						{
							title: "Teachers",
							url: "/dashboard/admin/attendance/teachers",
						},
						{
							title: "Students",
							url: "/dashboard/admin/attendance/students",
						}
					]
				},
				{
					title: "Classes",
					url: "/dashboard/admin/classes",
					icon: BookOpen,
				},
				{
					title: "Departments",
					url: "/dashboard/admin/departments",
					icon: Hotel,
				},
			],
			navSecondary: [
				{
					title: "Support",
					url: "#",
					icon: LifeBuoy,
				},
				{
					title: "Feedback",
					url: "#",
					icon: Send,
				},
			],
		},
		teacher: {
			user: {
				name: userData.fullName,
				email: userData.email,
				icon: User2,
			},
			navItems: [
				{
					title: "Timetable",
					url: "/dashboard/teacher/timetable",
					icon: TimerIcon,
				},
				{
					title: "My Attendence",
					url: "/dashboard/teacher/my-attendance",
					icon: BookMarkedIcon,
				},
				{
					title: "My Lectures",
					url: "/dashboard/teacher/attendance",
					icon: BookMarkedIcon,
				},
			]
		},
		staff: {
			user: {
				name: userData.fullName,
				email: userData.email,
				icon: UserCog2Icon,
			},
			navItems: [
				{
					title: "Students",
					url: "/dashboard/staff/students",
					icon: GraduationCap,
				},
				{
					title: "Timetables",
					url: "/dashboard/staff/timetable",
					icon: TimerIcon,
				},
				{
					title: "Attendence",
					url: "#",
					icon: BookMarkedIcon,
					items: [
						{
							title: "Teachers",
							url: "/dashboard/staff/attendance/teachers",
						},
						{
							title: "Students",
							url: "/dashboard/staff/attendance/students",
						}
					]
				},
			]
		},
		student: {
			user: {
				name: userData.fullName,
				email: userData.email,
				icon: User2,
			},
			navItems: [
				{
					title: "Timetables",
					url: "/dashboard/student/timetable",
					icon: TimerIcon,
				},
				{
					title: "Attendence",
					url: `/dashboard/student/attendance/student/${userData._id}`,
					icon: BookMarkedIcon,
				},
			]
		},
	};

	const filteredItems = SIDEBAR_ITEMS[userData.role];

	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="/">
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<Command className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">Talha College</span>
									<span className="truncate text-xs">collge</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={filteredItems.navItems} />
				{filteredItems.navSecondary != undefined && (
					<NavSecondary items={filteredItems.navSecondary} className="mt-auto" />
				)}
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={filteredItems.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
