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
