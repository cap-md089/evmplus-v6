import * as React from 'react';
import { InputProps } from './Input'
import { Identifiable } from 'common-lib';

interface AutocompleteProps<T> extends InputProps<T> {
	items: T[];
	renderItem: (item: T) => React.ReactChild;
}

export default class Autocomplete<
	T extends Identifiable
> extends React.Component<AutocompleteProps<T>> {
	public render() {
		return (
			<div />
		);
	}
}
