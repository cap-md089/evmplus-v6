/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	OtherMultCheckboxReturn,
	RadioReturnWithOther,
	SimpleMultCheckboxReturn,
} from '../typings/types';
import { Maybe as M, MaybeObj as Maybe } from './Maybe';

export const isOneOfSelected = (
	input: OtherMultCheckboxReturn | SimpleMultCheckboxReturn
): boolean => input.values.reduce((prev, curr) => prev || curr, false);

export const isSelected = (
	input: OtherMultCheckboxReturn | SimpleMultCheckboxReturn,
	value: string
): boolean => !!input.values[input.labels.indexOf(value)];

export const emptyFromLabels = (labels: string[]): OtherMultCheckboxReturn => ({
	labels,
	otherSelected: false,
	values: labels.map(_ => false),
});

export const emptySimpleFromLabels = (labels: string[]): SimpleMultCheckboxReturn => ({
	labels,
	values: labels.map(_ => false),
});

export const presentMultCheckboxReturn = (
	input: SimpleMultCheckboxReturn | OtherMultCheckboxReturn,
	seperator = ', '
): Maybe<string> => {
	const values = input.labels.filter((_, i) => input.values[i]);

	if ('otherSelected' in input && input.otherSelected) {
		values.push(input.otherValue);
	}

	const returnString = values.join(seperator);

	return !!returnString ? M.some(returnString) : M.none();
};

export const advancedMultCheckboxReturn = <T>(
	input: SimpleMultCheckboxReturn | OtherMultCheckboxReturn,
	mapFunction: (item: string) => T
): T[] => {
	const values = input.labels.filter((_, i) => input.values[i]);

	if ('otherSelected' in input && input.otherSelected) {
		values.push(input.otherValue);
	}

	return values.map(mapFunction);
};

export const presentRadioReturn = <E extends number>(input: RadioReturnWithOther<E>): string =>
	input.otherValueSelected ? input.otherValue : input.labels[input.selection];

export const defaultRadioFromLabels = <E extends number>(
	labels: string[]
): RadioReturnWithOther<E> => ({
	otherValueSelected: false,
	labels,
	selection: 0 as E,
});
