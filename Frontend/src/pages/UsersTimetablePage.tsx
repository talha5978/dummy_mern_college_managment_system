import React from "react";
import { isApiError } from "../utils/helpers";
import { toast } from "sonner";
import { SpinnerLoader } from "../components/Loaders";
import { useGetUserTimetablesQuery } from "../services/timetables.api";
import TimetableCards from "../components/TimetableCards";

const UserTimetablePage: React.FC = () => {
	const {
		data: timetables,
		isLoading: isFetchingTTs,
		error: TT_FetchingError,
	} = useGetUserTimetablesQuery({ week: true });
	
	console.log(timetables);
	
	if (isApiError(TT_FetchingError)) {
		console.error(TT_FetchingError.data.message);
		toast.error(TT_FetchingError.data.message);
	}

	if (isFetchingTTs) {
		return (
			<div className="flex w-full h-full items-center justify-center p-6 md:p-10">
				<SpinnerLoader />
			</div>
		);
	}
	
	return (
		<>
			<section className="space-y-4">
				{timetables?.data && Array.isArray(timetables?.data) && (
					<TimetableCards
						data={timetables?.data}
					/>
				)}
			</section>
		</>
	);
};

export default UserTimetablePage;
