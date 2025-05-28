import { clsx, type ClassValue } from "clsx"
import moment from "moment";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateTimeOptions = () => {
	const times = [];
	for (let hour = 0; hour < 24; hour++) {
		for (let minute = 0; minute < 60; minute += 5) {
			const timeMoment = moment({ hour, minute });
			const display = timeMoment.format("hh:mm A");
			const minutesSinceMidnight = hour * 60 + minute;
			times.push({ display, minutesSinceMidnight });
		}
	}
	return times;
};