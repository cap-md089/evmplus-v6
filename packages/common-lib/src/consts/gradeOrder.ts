/**
 * Copyright (C) 2020 Glenn Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { GradeOrder } from '../typings/types';

/*
 * This array maps the Member Grade to an arbitrary number that can be used to sort by rank
 */

export const GradeOrderMap: readonly GradeOrder[] = [
	{
		Grade: 'C/AB',
		GradeOrder: 0,
	},
	{
		Grade: 'CADET',
		GradeOrder: 0,
	},
	{
		Grade: 'C/Amn',
		GradeOrder: 1,
	},
	{
		Grade: 'C/A1C',
		GradeOrder: 2,
	},
	{
		Grade: 'C/SrA',
		GradeOrder: 3,
	},
	{
		Grade: 'C/SSgt',
		GradeOrder: 4,
	},
	{
		Grade: 'C/TSgt',
		GradeOrder: 5,
	},
	{
		Grade: 'C/MSgt',
		GradeOrder: 6,
	},
	{
		Grade: 'C/SMSgt',
		GradeOrder: 7,
	},
	{
		Grade: 'C/CMSgt',
		GradeOrder: 8,
	},
	{
		Grade: 'C/2dLt',
		GradeOrder: 9,
	},
	{
		Grade: 'C/1stLt',
		GradeOrder: 10,
	},
	{
		Grade: 'C/Capt',
		GradeOrder: 11,
	},
	{
		Grade: 'C/Maj',
		GradeOrder: 12,
	},
	{
		Grade: 'C/LtCol',
		GradeOrder: 13,
	},
	{
		Grade: 'C/Col',
		GradeOrder: 14,
	},
	{
		Grade: 'SM',
		GradeOrder: 20,
	},
	{
		Grade: 'SSgt',
		GradeOrder: 21,
	},
	{
		Grade: 'TSgt',
		GradeOrder: 22,
	},
	{
		Grade: 'MSgt',
		GradeOrder: 23,
	},
	{
		Grade: 'SMSgt',
		GradeOrder: 24,
	},
	{
		Grade: 'CMSgt',
		GradeOrder: 25,
	},
	{
		Grade: 'FO',
		GradeOrder: 30,
	},
	{
		Grade: 'TFO',
		GradeOrder: 31,
	},
	{
		Grade: 'SFO',
		GradeOrder: 32,
	},
	{
		Grade: '2d Lt',
		GradeOrder: 33,
	},
	{
		Grade: '1st Lt',
		GradeOrder: 34,
	},
	{
		Grade: 'Capt',
		GradeOrder: 35,
	},
	{
		Grade: 'Maj',
		GradeOrder: 36,
	},
	{
		Grade: 'Lt Col',
		GradeOrder: 37,
	},
	{
		Grade: 'Col',
		GradeOrder: 38,
	},
	{
		Grade: 'Brig Gen',
		GradeOrder: 39,
	},
	{
		Grade: 'Maj Gen',
		GradeOrder: 40,
	},
];
