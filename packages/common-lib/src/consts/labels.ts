/**
 * Copyright (C) 2020 Andrew Rioux
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

import { EventStatus } from '../typings/types';

export const SMUniforms = [
	'Dress Blue A',
	'Dress Blue B',
	'Airman Battle Uniform (ABU)',
	'PT Gear',
	'Polo Shirts',
	'Blue Utilities',
	'Civilian Attire',
	'Flight Suit',
	'Not Applicable',
];
export const CUniforms = [
	'Dress Blue A',
	'Dress Blue B',
	'Airman Battle Uniform (ABU)',
	'PT Gear',
	'Civilian Attire',
	'Flight Suit',
	'Not Applicable',
];
export const Activities = [
	'Squadron Meeting',
	'Classroom/Tour/Light',
	'Backcountry',
	'Flying',
	'Physically Rigorous',
	'Recurring Meeting',
];
export const RequiredForms = [
	'CAP Identification Card',
	'CAPF 31 Application For CAP Encampment Or Special Activity',
	'CAPF 60-80 Civil Air Patrol Cadet Activity Permission Slip',
	'CAPF 101 Specialty Qualification Card',
	'CAPF 160 CAP Member Health History Form',
	'CAPF 161 Emergency Information',
	'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication',
];
export const Meals = ['No meals provided', 'Meals provided', 'Bring own food', 'Bring money'];
export const LodgingArrangments = [
	'Hotel or individual room',
	'Open bay building',
	'Large tent',
	'Individual tent',
];

export const EventStatusLabels = [
	'Draft',
	'Tentative',
	'Confirmed',
	'Complete',
	'Cancelled',
	'Information Only',
];

export const EventStatusDisplay = {
	[EventStatus.DRAFT]: 'Draft',
	[EventStatus.TENTATIVE]: 'Tentative',
	[EventStatus.CONFIRMED]: 'Confirmed',
	[EventStatus.COMPLETE]: 'Complete',
	[EventStatus.CANCELLED]: 'Cancelled',
	[EventStatus.INFORMATIONONLY]: 'Information Only',
};
