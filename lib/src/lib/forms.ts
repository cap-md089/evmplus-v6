import {
	OtherMultCheckboxReturn,
	RadioReturnWithOther,
	SimpleMultCheckboxReturn
} from '../typings/types';
import { just, Maybe, none } from './Maybe';

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
	values: labels.map(_ => false)
});

export const emptySimpleFromLabels = (labels: string[]): SimpleMultCheckboxReturn => ({
	labels,
	values: labels.map(_ => false)
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

	return !!returnString ? just(returnString) : none();
};

export const presentRadioReturn = <E extends number>(input: RadioReturnWithOther<E>): string =>
	input.otherValueSelected ? input.otherValue : input.labels[input.selection];
