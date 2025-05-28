import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimetableType } from "../types/global";
import { BookOpen, CalendarOff, Clock, Pencil, Trash2, User } from "lucide-react";
import moment from "moment";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";

interface TimetableDay {
	day: string;
	data: TimetableType[];
	isToday: boolean;
}

interface TimetableCardsProps {
	data: TimetableDay[];
	handleUpdate?: (entry: TimetableType) => void;
	onDelete?: (id: string) => void;
}

const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TimetableCards = ({ data, handleUpdate, onDelete }: TimetableCardsProps) => {
	const sortedData = daysOrder.map((day) => {
		const dayData = data.find((item) => item.day === day);
		return {
			day,
			data: dayData ? dayData.data : [],
			isToday: dayData ? dayData.isToday : false,
		};
	});

	return (
			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{sortedData.map((dayData) => {
					// Sort entries by start time within each day
					const sortedEntries = [...dayData.data].sort((a, b) => {
						const timeA = moment(a.timeslot.start, "hh:mm A");
						const timeB = moment(b.timeslot.start, "hh:mm A");
						return timeA.diff(timeB);
					});

					return (
						<Card
							key={dayData.day}
							className={cn(
								"bg-secondary shadow-lg rounded-xl border-b-0 border-t-0 border-r-0",
								dayData.isToday && "border-l-6 dark:border-white border-blue-500 rounded-l-lg"
							)}
						>
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--chart-3))] to-[hsl(var(--chart-1))]">
										{dayData.day}
									</CardTitle>
									{dayData.isToday && (
										<Badge className="bg-gradient-to-r from-[hsl(var(--chart-3))] to-[hsl(var(--chart-1))] text-white rounded-full px-3 py-1">
											Today
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent className="pt-6">
								{sortedEntries.length > 0 ? (
									<div className="relative space-y-6">
										{/* Timeline line */}
										<div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-[hsl(var(--chart-3))]"></div>

										{sortedEntries.map((entry) => (
											<div
												key={entry._id}
												className="relative flex space-x-4 pl-12 pr-4 py-4 rounded-lg"
											>
												{/* Timeline dot */}
												<div
													className={cn(
														"absolute left-4 top-6 w-5 h-5 bg-blue-500 rounded-full border-4 border-white",
														entry.isOngoing && "bg-green-500 animate-pulse"
													)}
												></div>
												<div className="flex-1">
													<div className="flex justify-between items-start">
														<div className="flex items-center space-x-2">
															<Clock className="w-5 h-5 text-blue-500" />
															<span className="text-sm font-medium text-gray-700 dark:text-muted-dark">
																{entry.timeslot.start} - {entry.timeslot.end}
															</span>
														</div>
													</div>
													<h3 className="text-lg font-semibold text-gray-700 dark:text-muted-dark mt-1 flex items-center space-x-2">
														<BookOpen className="w-5 h-5 text-indigo-500" />
														<span>{entry.subject}</span>
													</h3>
													{entry.teacher && (
														<div className="flex items-center space-x-2 mt-1">
															<User className="w-4 h-4 text-blue-500" />
															<p className="text-sm text-muted-foreground">
																Prof. {entry.teacher}
															</p>
														</div>
													)}
													{entry.section && (
														<div className="mt-2">
															<span className="text-gray-700 dark:text-muted-dark px-2 py-1 outline-1 outline-black dark:outline-amber-50 rounded-4xl text-xs">
																{entry.section}
															</span>
														</div>
													)}
												</div>
												<div className="flex items-center flex-col justify-between">
													{entry.isOngoing ? (
														<Badge className="bg-green-500 text-white animate-pulse">
															Ongoing
														</Badge>
													) : (
														<div />
													)}
													<div className="flex flex-col self-end">
														{handleUpdate && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleUpdate(entry)}
																className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
															>
																<Pencil className="w-4 h-4" />
															</Button>
														)}
														{onDelete && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => onDelete(entry._id)}
																className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-6 text-gray-500">
										<CalendarOff className="w-8 h-8 mb-2" />
										<p>No classes scheduled</p>
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</section>
	);

};

export default TimetableCards;
