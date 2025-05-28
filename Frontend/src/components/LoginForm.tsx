import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
  } from "@/components/ui/select"  
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { DispatchType } from "../store/store";
import { roles } from "../constants";
import { LoginFormTypes } from "../types/global";
import { useLoginMutation } from "../services/authentication.api";
import {login} from "../store/authSlice"
import { LoaderCircle } from "lucide-react";
import { useNavigateToRole } from "../utils/helpers";

export const LoginForm = () => {
	const [selectedRole, setSelectedRole] = useState<string>("student");

	const dispatch: DispatchType = useDispatch();
	const navigateToRole = useNavigateToRole();
	// TODO: If we get the data from here then it will be the cached result from last successful mutation
	const [loginMutation, { isLoading }] = useLoginMutation();

	const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormTypes>({
		defaultValues: { role: "student" }
	});

	const handleRoleChange = (role: string) => {
		setSelectedRole(role);
		setValue("role", role);
	};
	
	const handleLogin = async (data: LoginFormTypes) => {
		for (let key in data) {
			key = key.trim();
		}
		try {
			const session = await loginMutation(data).unwrap();
			
			if (session.success) {
				dispatch(login(session.data?.user));
				toast.success(session.message);
			}

			navigateToRole(session.data?.user?.role as string);
			
		} catch (error: any) {
			if (!error.data.success) {
				toast.error("Login Failed", {
					description: error?.data?.message,
					style: {
						backgroundColor: 'var(--destructive-foreground)',
						borderColor: 'var(--destructive)',
					},
				});
			}
		}
		return null;
	};

	return (
		<div className={cn("flex flex-col gap-6")}>
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Login</CardTitle>
					<CardDescription>
						Enter your credentials to login to your college portal
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(handleLogin)}>
						<div className="flex flex-col gap-6">
							<div className="grid gap-2">
								<Label htmlFor="email">Role</Label>
								<Select
								id="role"
								value={selectedRole}
								onValueChange={handleRoleChange}
								>
									<SelectTrigger className="w-full cursor-pointer">
										<SelectValue placeholder="Your Role" />
									</SelectTrigger>
									<SelectContent>
										{Object.values(roles).map((role, index) => (
											<SelectItem key={index} value={role}>
												{role.charAt(0).toUpperCase() + role.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="email@clg.com"
									{...register("email", {
										required: "Email address is required",
									})}
								/>
								{errors.email && (
									<Label
										className="text-destructive mt-1 text-xs"
										htmlFor="email"
									>
										{errors.email.message}
									</Label>
								)}
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									{...register("password", {
										required: "Password is required",
									})}
								/>
								{errors.password && (
									<Label
										className="text-destructive mt-1 text-xs"
										htmlFor="password"
									>
										{errors.password.message}
									</Label>
								)}
							</div >
							<Button type="submit" className="w-full cursor-pointer" disabled={isLoading} >
								{isLoading ? (
									<span className="animate-spin animate-duration-1000 animate-iteration-count-infinite">
										<LoaderCircle width={16} height={16} />
									</span>
								) : "Login"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
