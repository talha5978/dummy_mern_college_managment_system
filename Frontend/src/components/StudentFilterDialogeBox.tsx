import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { ClassType, ProgrammeType } from '../types/global';
import { closeDialoge, resetStudentsFiltersState, setStudentsFiltersState, stateDialogeBoxes } from "../store/uiSlice";
import { useDispatch, useSelector } from "react-redux";

interface StudentsFilterForm {
    programs?: ProgrammeType[];
    classes?: ClassType[];
}

const FilterForm = ({ programs = [], classes = [] }: StudentsFilterForm) => {
	const dispatch = useDispatch();
	let $ = useSelector((state: any) => state.ui.studentsFiltersState);

	const defaultReduxFitlers = { ...$ };
	delete defaultReduxFitlers.limit;
	delete defaultReduxFitlers.page;

	const { control, register, handleSubmit, reset } = useForm({
		defaultValues: defaultReduxFitlers
	});
	
	const handleReset = () => {
		reset(); // Reset the form
		dispatch(closeDialoge(stateDialogeBoxes.studentFilterDialogeBoxOpen));
		dispatch(resetStudentsFiltersState()); // Reset Redux state
	};

	const handleFilterations = async (data: any) => {
		const filteredData = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => value !== "")
		);
		//console.log(data);
		dispatch(setStudentsFiltersState(filteredData));
	};

	return (
		<form onSubmit={handleSubmit(handleFilterations)} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Filter Options Header */}
				<div className="space-y-4 md:col-span-2">
					<h3 className="text-[1.05rem] font-semibold border-b pb-2">Filter Options</h3>
				</div>

				{/* Roll Number */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="rollNumber">Roll Number</Label>
					<Input id="rollNumber" placeholder="Enter roll number" maxLength={70} {...register("rollNumber")} />
				</div>

				{/* Full Name */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="fullName">Full Name</Label>
					<Input id="fullName" placeholder="Enter full name" maxLength={70} {...register("fullName")} />
				</div>

				{/* Gender */}
				<div className="grid gap-2">
					<Label htmlFor="gender">Gender</Label>
					<Controller
						name="gender"
						control={control}
						render={({ field }) => (
							<RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-4">
								<div className="flex gap-1 items-center justify-center cursor-pointer">
									<RadioGroupItem value="Male" id="male" />
									<Label htmlFor="male">Male</Label>
								</div>

								<div className="flex gap-1 items-center justify-center cursor-pointer">
									<RadioGroupItem value="Female" id="female" />
									<Label htmlFor="female">Female</Label>
								</div>

								<div className="flex gap-1 items-center justify-center cursor-pointer">
									<RadioGroupItem value="Other" id="other" />
									<Label htmlFor="other">Other</Label>
								</div>
							</RadioGroup>
						)}
					/>
				</div>

				{/* Programme */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="program">Programme</Label>
					<Controller
						name="program"
						control={control}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select programme" />
								</SelectTrigger>
								<SelectContent>
									{programs.length > 0 ? (
										programs.map((program) => (
											<SelectItem key={program._id} value={program._id}>
												{program.name}
											</SelectItem>
										))
									) : (
										<p className="text-sm p-1 text-destructive">No programmes found</p>
									)}
								</SelectContent>
							</Select>
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
									<SelectItem value="Alumni">Alumni</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				{/* Class */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="classId">Class</Label>
					<Controller
						name="classId"
						control={control}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select class" />
								</SelectTrigger>
								<SelectContent>
									{classes.length > 0 ? (
										classes.map((classItem) => (
											<SelectItem key={classItem._id} value={classItem._id}>
												{classItem.name}
											</SelectItem>
										))
									) : (
										<p className="text-sm p-1 text-destructive">No classes found</p>
									)}
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				{/* Section */}
				<div className="*:w-full grid gap-2">
					<Label htmlFor="sectionId">Section</Label>
					<Controller
						name="sectionId"
						control={control}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select section" />
								</SelectTrigger>
								<SelectContent>
									{classes.map((i) => i.sections).length > 0 ? (
										classes.flatMap((classItem) =>
											classItem.sections.map((section) => (
												<SelectItem key={section._id} value={section._id}>
													{section.name}
												</SelectItem>
											))
										)
									) : (
										<p className="text-sm p-1 text-destructive">No sections found</p>
									)}
								</SelectContent>
							</Select>
						)}
					/>
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
									<SelectItem value="rollNumber">Roll Number</SelectItem>
									<SelectItem value="gender">Gender</SelectItem>
									<SelectItem value="createdAt">Created At</SelectItem>
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
				<Button type="button" className="cursor-pointer" variant="outline" onClick={() => handleReset()}>
					Reset
				</Button>
				<DialogClose asChild>
					<Button type="submit" className="cursor-pointer">
						Apply Filters
					</Button>
				</DialogClose>
			</DialogFooter>
		</form>
	);
};

function StudentFilterDialogeBox() {
    const dispatch = useDispatch();
	const dialogOpen = useSelector((state: any) => state.ui.dialogeBoxes.studentFilterDialogeBoxOpen);
	const classes: ClassType[] = useSelector((state: any) => state.academics.classes);
	const programs: ProgrammeType[] = useSelector((state: any) => state.academics.programmes);

	return (
		<Dialog
			open={dialogOpen}
			onOpenChange={() =>
				dispatch(
					closeDialoge(stateDialogeBoxes.studentFilterDialogeBoxOpen)
				)
			}
		>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Filter & Sort Students</DialogTitle>
                    <DialogDescription>
                        Apply filters and sort options to refine the student list.
                    </DialogDescription>
				</DialogHeader>
				<FilterForm classes={classes} programs={programs} />
			</DialogContent>
		</Dialog>
	);
}


export default StudentFilterDialogeBox;