const zeroPad = (n: number, a = 2) => ('00' + n).substr(-a);

export const formatEventViewerDate = (date: number) => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(hour)}:${zeroPad(minute)} on ${zeroPad(month + 1)}/${zeroPad(day)}/${year}`;
};

export const formatGoogleCalendarDate = (date: number) => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${hour === 12 ? 12 : hour % 12}:${zeroPad(minute)} ${hour >= 12 ? 'PM' : 'AM'} on ${
		month + 1
	}/${day}/${year}`;
};

export function formatPhone(phone: string) {
	// strip spaces and non-numeric characters
	phone.trimLeft().trimRight();
	// add 2 dots
	return phone.substring(0, 3) + '.' + phone.substring(3, 6) + '.' + phone.substring(6, 10);
}
