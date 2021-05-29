/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

export const zeroPad = (n: number, a = 2): string => `00${n}`.substr(-a);

export const formatEventViewerDate = (date: number): string => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(hour)}:${zeroPad(minute)} on ${zeroPad(month + 1)}/${zeroPad(day)}/${year}`;
};

export const formatPhone = (phone: string): string => {
	// strip spaces and non-numeric characters
	phone.trimLeft().trimRight();
	// add 2 dots
	return phone.substring(0, 3) + '.' + phone.substring(3, 6) + '.' + phone.substring(6, 10);
};
