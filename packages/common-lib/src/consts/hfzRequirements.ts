/**
 * Copyright (C) 2020 Glenn Rioux
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

import { CadetHFZRequirements } from '../typings/types';

/*
 * This array maps the Healthy Fitness Zone requirements by gender and age
 *
 */

export const CadetPromotionRequirementsMap: readonly CadetHFZRequirements[] = [
	{
		Age: 10,
		Gender: 'MALE',
		Pacer: 17,
		MileRun: '11:30',
		CurlUps: 12,
		PushUps: 7,
		SitReach: 8,
	},
	{
		Age: 11,
		Gender: 'MALE',
		Pacer: 20,
		MileRun: '11:10',
		CurlUps: 15,
		PushUps: 8,
		SitReach: 8,
	},
	{
		Age: 12,
		Gender: 'MALE',
		Pacer: 23,
		MileRun: '10:40',
		CurlUps: 18,
		PushUps: 10,
		SitReach: 8,
	},
	{
		Age: 13,
		Gender: 'MALE',
		Pacer: 29,
		MileRun: '9:46',
		CurlUps: 21,
		PushUps: 12,
		SitReach: 8,
	},
	{
		Age: 14,
		Gender: 'MALE',
		Pacer: 36,
		MileRun: '9:22',
		CurlUps: 24,
		PushUps: 14,
		SitReach: 8,
	},
	{
		Age: 15,
		Gender: 'MALE',
		Pacer: 42,
		MileRun: '9:04',
		CurlUps: 24,
		PushUps: 16,
		SitReach: 8,
	},
	{
		Age: 16,
		Gender: 'MALE',
		Pacer: 47,
		MileRun: '8:42',
		CurlUps: 24,
		PushUps: 18,
		SitReach: 8,
	},
	{
		Age: 17,
		Gender: 'MALE',
		Pacer: 50,
		MileRun: '8:22',
		CurlUps: 24,
		PushUps: 18,
		SitReach: 8,
	},
	{
		Age: 18,
		Gender: 'MALE',
		Pacer: 54,
		MileRun: '8:04',
		CurlUps: 24,
		PushUps: 18,
		SitReach: 8,
	},
	{
		Age: 10,
		Gender: 'FEMALE',
		Pacer: 17,
		MileRun: '11:30',
		CurlUps: 12,
		PushUps: 7,
		SitReach: 9,
	},
	{
		Age: 11,
		Gender: 'FEMALE',
		Pacer: 20,
		MileRun: '11:10',
		CurlUps: 15,
		PushUps: 7,
		SitReach: 10,
	},
	{
		Age: 12,
		Gender: 'FEMALE',
		Pacer: 23,
		MileRun: '10:40',
		CurlUps: 18,
		PushUps: 7,
		SitReach: 10,
	},
	{
		Age: 13,
		Gender: 'FEMALE',
		Pacer: 25,
		MileRun: '10:20',
		CurlUps: 18,
		PushUps: 7,
		SitReach: 10,
	},
	{
		Age: 14,
		Gender: 'FEMALE',
		Pacer: 27,
		MileRun: '10:09',
		CurlUps: 18,
		PushUps: 7,
		SitReach: 10,
	},
	{
		Age: 15,
		Gender: 'FEMALE',
		Pacer: 30,
		MileRun: '9:58',
		CurlUps: 18,
		PushUps: 7,
		SitReach: 12,
	},
	{
		Age: 16,
		Gender: 'FEMALE',
		Pacer: 32,
		MileRun: '9:46',
		CurlUps: 18,
		PushUps: 7,
		SitReach: 12,
	},
	{
		Age: 17,
		Gender: 'FEMALE',
		Pacer: 35,
		MileRun: '9:34',
		CurlUps: 18,
		PushUps: 7,
		SitReach: 12,
	},
	{
		Age: 18,
		Gender: 'FEMALE',
		Pacer: 38,
		MileRun: '9:22',
		CurlUps: 18,
		PushUps: 7,
		SitReach: 12,
	},
];
