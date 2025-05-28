import { useSelector } from "react-redux";
import { DataTableViewOptionsProps } from "./ComplexDataTable";
import { openDialog, setStudentDialogeData, stateDialogeBoxes } from "../store/uiSlice";
import { Button } from "@/components/ui/button";
import { Badge, Filter, PlusIcon, Settings2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuCheckboxItem } from "./ui/dropdown-menu";


export function DataTableViewOptions<TData>({ table, disabled, dispatch }: DataTableViewOptionsProps<TData>) {
	const $ = useSelector((state: any) => state.ui.studentsFiltersState);
	const filters = { ...$ };
	delete filters.limit;
	delete filters.page;
	const activeFiltersCount = Object.values(filters).filter((val) => val != "").length;

	const handleFilterClick = () => {
		dispatch(openDialog(stateDialogeBoxes.studentFilterDialogeBoxOpen));
	};

	const handleAddClick = () => {
		dispatch(setStudentDialogeData(null));
		dispatch(openDialog(stateDialogeBoxes.addStudentDialogeBoxOpen));
	};

	return (
		<div className="flex gap-2">
			<Button
				variant="outline"
				size="sm"
				className="cursor-pointer dark:hover:bg-muted relative"
				onClick={handleFilterClick}
			>
				<Filter />
				<span className="hidden md:inline">Filters</span>
				{activeFiltersCount > 0 && (
					<Badge className="absolute -top-3 -right-2 text-[0.6rem] px-2">{activeFiltersCount}</Badge>
				)}
			</Button>
			<Button
				variant="outline"
				size="sm"
				className="cursor-pointer dark:hover:bg-muted"
				onClick={handleAddClick}
			>
				<PlusIcon />
				<span className="hidden md:inline">Add Teacher</span>
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
						disabled={disabled}
					>
						<Settings2 />
						<span className="hidden md:inline">View</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[150px]">
					<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{table
						.getAllColumns()
						.filter((column: any) => typeof column.accessorFn !== "undefined" && column.getCanHide())
						.map((column: any) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="cursor-pointer"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
