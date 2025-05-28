import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ApiError, DepartmentType } from "../types/global";
import {
	closeDialoge,
	resetTeachersFiltersState,
	setTeachersFiltersState,
	stateDialogeBoxes,
} from "../store/uiSlice";
import { useDispatch, useSelector } from "react-redux";
import { getDepartments, handleDepartmentsFetchingError } from "./TeacherForm";
import { SpinnerLoader } from "./Loaders";
import { isEmptyObject } from "../utils/helpers";
import { toast } from "sonner";
import { warningToastOptions } from "./ui/sonner";

type FilterFormProps = {
	departments: DepartmentType[];
};

const FilterForm: React.FC<FilterFormProps> = ({ departments }) => {
	const dispatch = useDispatch();
	const filters = useSelector((state: any) => state.ui.teachersFiltersState);

	const defaultReduxFilters = { ...filters };
	delete defaultReduxFilters.limit;
	delete defaultReduxFilters.page;

	// Determine if the existing filter is a range and set appropriate default values
	const isRangeFilter = defaultReduxFilters.filterType && defaultReduxFilters.filterType.includes("-");
	let salaryFilterType, salaryValue, minSalary, maxSalary;

	if (isRangeFilter) {
		salaryFilterType = "between";
		if (defaultReduxFilters.baseSalary) {
			const [min, max] = defaultReduxFilters.baseSalary.split("-");
			minSalary = min;
			maxSalary = max;
		}
	} else {
		salaryFilterType = defaultReduxFilters.filterType;
		salaryValue = defaultReduxFilters.baseSalary;
	}

	const { control, register, handleSubmit, reset } = useForm({
		defaultValues: {
			...defaultReduxFilters,
			salaryFilterType,
			salaryValue,
			minSalary,
			maxSalary,
		},
	});

	const salaryFilterTypeValue = useWatch({ control, name: "salaryFilterType" });

	const handleReset = () => {
		reset();
		dispatch(closeDialoge(stateDialogeBoxes.teacherFilterDialogeBoxOpen));
		dispatch(resetTeachersFiltersState());
	};

	const handleFilterations = async (data: any) => {
		for (const key in data) {
			if (typeof data[key] === "string") {
				data[key] = data[key].trim();
			}
		}

		const { salaryValue, minSalary, maxSalary, salaryFilterType: formFilterType, ...rest } = data;

		let filterType = "";
		let baseSalary = "";

		if (formFilterType) {
			if (formFilterType === "between" && minSalary && maxSalary) {
				filterType = "$gte-$lte";
				baseSalary = `${minSalary}-${maxSalary}`;
			} else if (["$gte", "$lte", "$gt", "$lt"].includes(formFilterType) && salaryValue) {
				filterType = formFilterType;
				baseSalary = salaryValue;
			}
		}

		const filteredData = { ...rest, filterType, baseSalary };
		let finalData = Object.fromEntries(
			Object.entries(filteredData).filter(
				([_, value]) => value !== "" && value !== null && value !== undefined
			)
		);

		if (isEmptyObject(finalData)) {
			toast.warning("Please select at least one filter option.", warningToastOptions);
			return;
		}
		
		dispatch(setTeachersFiltersState(finalData));
	};

	return (
		<form onSubmit={handleSubmit(handleFilterations)} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Filter Options Header */}
				<div className="space-y-4 md:col-span-2">
					<h3 className="text-[1.05rem] font-semibold border-b pb-2">Filter Options</h3>
				</div>

				{/* Full Name */}
				<div className="grid gap-2">
					<Label htmlFor="fullName">Full Name</Label>
					<Input id="fullName" placeholder="Enter full name" maxLength={70} {...register("fullName")} />
				</div>

				{/* Email */}
				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" placeholder="Enter email" type="email" {...register("email")} />
				</div>

				{/* Gender */}
				<div className="grid gap-2">
					<Label htmlFor="gender">Gender</Label>
					<Controller
						name="gender"
						control={control}
						render={({ field }) => (
							<RadioGroup
								value={field.value}
								onValueChange={field.onChange}
								className="flex space-x-4"
							>
								<div className="flex gap-1 items-center cursor-pointer">
									<RadioGroupItem value="Male" id="male" />
									<Label htmlFor="male">Male</Label>
								</div>
								<div className="flex gap-1 items-center cursor-pointer">
									<RadioGroupItem value="Female" id="female" />
									<Label htmlFor="female">Female</Label>
								</div>
								<div className="flex gap-1 items-center cursor-pointer">
									<RadioGroupItem value="Other" id="other" />
									<Label htmlFor="other">Other</Label>
								</div>
							</RadioGroup>
						)}
					/>
				</div>

				{/* Status */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="status">Status</Label>
					<Controller
						name="status"
						control={control}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Active">Active</SelectItem>
									<SelectItem value="Inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				{/* Subject Specialization */}
				<div className="grid gap-2">
					<Label htmlFor="subjectSpecialization">Subject Specialization</Label>
					<Input
						id="subjectSpecialization"
						placeholder="Enter subject specialization"
						{...register("subjectSpecialization")}
					/>
				</div>

				{/* Departments */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="departments">Departments</Label>
					<Controller
						name="departments"
						control={control}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select department" />
								</SelectTrigger>
								<SelectContent>
									{departments.length > 0 ? (
										departments.map((item) => (
											<SelectItem key={item._id} value={item._id}>
												{item.name}
											</SelectItem>
										))
									) : (
										<p className="text-sm p-1 text-destructive">No departments found</p>
									)}
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				{/* Salary Filter */}
				<div className="*:w-full md:col-span-2 space-y-4">
					<Label>Base Salary Filter</Label>
					<div
						className={`grid grid-cols-1 ${
							salaryFilterTypeValue !== "between" ? "md:grid-cols-2" : "md:grid-cols-3"
						} gap-2 *:w-full`}
					>
						<Controller
							name="salaryFilterType"
							control={control}
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue placeholder="Select filter type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="$gte">Greater than or equal to</SelectItem>
										<SelectItem value="$lte">Less than or equal to</SelectItem>
										<SelectItem value="$gt">Greater than</SelectItem>
										<SelectItem value="$lt">Less than</SelectItem>
										<SelectItem value="between">Between</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
						{salaryFilterTypeValue === "between" ? (
							<>
								<Input type="number" placeholder="Min. salary" {...register("minSalary")} />
								<Input type="number" placeholder="Max. salary" {...register("maxSalary")} />
							</>
						) : (
							salaryFilterTypeValue && (
								<Input
									type="number"
									placeholder="Enter base salary"
									{...register("salaryValue")}
									className="md:col-span-1"
								/>
							)
						)}
					</div>
				</div>

				{/* Sort Options Header */}
				<div className="md:col-span-2 mt-2 space-y-4">
					<h3 className="text-[1.05rem] font-semibold border-b pb-2">Sort Options</h3>
				</div>

				{/* Sort By */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="sortBy">Sort By</Label>
					<Controller
						name="sortBy"
						control={control}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Sort by field" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fullName">Full Name</SelectItem>
									<SelectItem value="email">Email</SelectItem>
									<SelectItem value="gender">Gender</SelectItem>
									<SelectItem value="subjectSpecialization">Subject Specialization</SelectItem>
									<SelectItem value="salaryDetails.baseSalary">Base Salary</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				{/* Sort Order */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="sortType">Sort Order</Label>
					<Controller
						name="sortType"
						control={control}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Sort order" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="asc">Ascending</SelectItem>
									<SelectItem value="desc">Descending</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</div>
			</div>

			{/* Buttons */}
			<DialogFooter>
				<Button type="button" variant="outline" onClick={handleReset}>
					Reset
				</Button>
				<DialogClose asChild>
					<Button type="submit">Apply Filters</Button>
				</DialogClose>
			</DialogFooter>
		</form>
	);
};

function TeacherFilterDialogeBox() {
	const dispatch = useDispatch();
	const dialogOpen = useSelector((state: any) => state.ui.dialogeBoxes.teacherFilterDialogeBoxOpen);

	const { fetchedDepartments, isFetchingDepartments, departmentsFetchingError } = getDepartments();

	if (departmentsFetchingError && fetchedDepartments == null) {
		return handleDepartmentsFetchingError(departmentsFetchingError as ApiError);
	}

	return (
		<Dialog
			open={dialogOpen}
			onOpenChange={() => dispatch(closeDialoge(stateDialogeBoxes.teacherFilterDialogeBoxOpen))}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Filter & Sort Teachers</DialogTitle>
					<DialogDescription>
						Apply filters and sort options to refine the student list.
					</DialogDescription>
				</DialogHeader>
				{isFetchingDepartments ? (
					<div className="flex w-full items-center justify-center p-6 md:p-10">
						<div className="flex flex-col justify-center gap-4">
							<p>We are seting up things for you so please be patient...</p>
							<SpinnerLoader />
						</div>
					</div>
				) : !isFetchingDepartments && fetchedDepartments != null ? (
					<FilterForm {...{ departments: fetchedDepartments?.data?.departments as DepartmentType[] }} />
				) : null}
			</DialogContent>
		</Dialog>
	);
}

export default TeacherFilterDialogeBox;
