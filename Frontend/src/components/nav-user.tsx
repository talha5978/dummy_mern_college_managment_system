import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	LogOut,
	LucideSettings,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useLogoutMutation } from "../services/authentication.api";
import { toast } from "sonner";
import { SpinnerLoader } from "./Loaders";
import { logout as StoreLogout } from "../store/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { DispatchType, RootState } from "../store/store";
import { useNavigate } from "react-router";
import { ApiError } from "../types/global";
import { Fragment, useState } from "react";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		icon: LucideIcon;
	};
}) {
	const { isMobile } = useSidebar();
    const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
    const dispatch: DispatchType = useDispatch();
	const navigate = useNavigate();

	const [settingClicked, setSettingClicked] = useState<boolean>(false);
	const currentUserData = useSelector((state: RootState) => state.auth.userData);

	const detailTitles: { [key: string]: string } = {
		_id: "ID",
		fullName: "Name",
		email: "Email",
		contactNumber: "Contact Number",
		gender: "Gender",
		address: "Address",
		createdAt: "Created At",
		updatedAt: "Updated At",
		role: "Role",
		dob: "Date of Birth",
		departments: "Departments",
		subjectSpecialization: "Subject Specialization",
		salaryDetails: "Salary Details",
		status: "Status",
		program: "Program",
		rollNumber: "Roll Number",
		sessionYears: "Session Years",
		class: "Class",
		section: "Section",
		feeDetails: "Fee Details",
	};

	const dialogData = currentUserData
		? Object.keys(currentUserData).map((key) => ({
				title: detailTitles[key as keyof typeof detailTitles],
				value: currentUserData?.[key as keyof typeof currentUserData],
		}))
		: [];

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const res = await logout().unwrap();

            if (res && res.success) {
                dispatch(StoreLogout());
                toast.success("Logged out successfully");
				navigate("/login");
            }
        } catch (error: ApiError | any) {
            if (!error.data.success) {
				console.error(error.data.message);
				toast.error("Logout Failed", {
					description: error?.data?.message || "Please try again later",
					style: {
						backgroundColor: 'var(--destructive-foreground)',
						borderColor: 'var(--destructive)',
					},
				});
			}
        }
    }

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="h-8 w-8 rounded-lg">
									<user.icon className="w-6" />
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
								<ChevronsUpDown className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side={isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<user.icon />
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">{user.name}</span>
										<span className="truncate text-xs">{user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={() => setSettingClicked(true)}>
									<LucideSettings />
									See Details
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={(e: React.MouseEvent) => handleLogout(e)}
								variant="destructive"
								disabled={isLoggingOut}
							>
								<LogOut />
								<div className="flex items-center justify-between w-full">
									<p>Logout</p>
									{isLoggingOut && <SpinnerLoader width={16} height={16} color="red" />}
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
			<Dialog open={settingClicked} onOpenChange={setSettingClicked}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>User Details</DialogTitle>
					</DialogHeader>

					{/* Make this container scrollable */}
					<div className="mt-2 max-h-[70vh] overflow-y-auto pr-2 flex flex-col gap-3">
						{currentUserData &&
							dialogData.map((item, index) => (
								<Fragment key={index}>
									<div className="space-y-2 rounded-md p-4 border border-muted shadow-sm">
										<div className="flex items-start gap-2">
											<p className="font-semibold text-muted-foreground">
												{item.title}:
											</p>

											{typeof item.value === "object" && !Array.isArray(item.value) ? (
												<div>
													{Object.entries(item.value).map(([key, value]) => (
														<div key={key} className={`space-y-2 ${!Array.isArray(value) ? "flex gap-2" : ""}`}>
															<p className="font-medium text-sm text-muted-foreground uppercase">
																{key}:
															</p>

															{Array.isArray(value) ? (
																<ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
																	{value.map((arrayItem, i) => (
																		<li key={i} className="flex gap-2 flex-col">
																			{typeof arrayItem === "object" ? (
																				<div className="space-y-1 pl-2 border-l border-muted">
																					{Object.entries(
																						arrayItem
																					).map(
																						([
																							subKey,
																							subValue,
																						]) => (
																							<div
																								key={subKey}
																								className="flex gap-2 text-sm text-muted-foreground"
																							>
																								<span className="text-muted-foreground font-semibold">
																									{subKey}:
																								</span>
																								<span>
																									{String(
																										subValue
																									)}
																								</span>
																							</div>
																						)
																					)}
																				</div>
																			) : (
																				<span>
																					{String(arrayItem)}
																				</span>
																			)}
																			<div className="h-[1px] bg-muted-foreground"/>
																		</li>
																	))}
																</ul>
															) : (
																<p className="text-sm text-muted-foreground ml-2">
																	{String(value)}
																</p>
															)}
														</div>
													))}
												</div>
											) : (
												<p className="text-muted-foreground">{String(item.value)}</p>
											)}
										</div>
									</div>

									{/* Divider */}
									{index < dialogData.length - 1 && <div className="my-4 h-px bg-muted" />}
								</Fragment>
							))}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
