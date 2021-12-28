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

import * as React from 'react';
import { InputProps } from './Input';
import { identity } from 'common-lib';
import { default as ReactAutocomplete } from 'react-autocomplete';
import './Autocomplete.css';

interface AutocompleteProps<T> extends InputProps<T> {
	items: T[];
	renderItem: (item: T, isHighlighted: boolean) => React.ReactChild;
}

interface LaxAutocompleteProps extends Omit<AutocompleteProps<string>, 'renderItem'> {
	renderItem?: (item: string, isHighlighted: boolean) => React.ReactChild;
}

export default class LaxAutocomplete extends React.Component<LaxAutocompleteProps> {
	public render = (): JSX.Element => (
		<div className="input-formbox">
			<ReactAutocomplete
				autoHighlight={true}
				items={this.props.items}
				getItemValue={identity}
				renderItem={(value, isHighlighted) => (
					<div>{(this.props.renderItem ?? identity)(value, isHighlighted)}</div>
				)}
				value={this.props.value ?? ''}
				onChange={e => this.update(e.target.value)}
				onSelect={val => this.update(val)}
				shouldItemRender={(item: string, value) =>
					item.toLowerCase().includes(value.toLowerCase())
				}
			/>
		</div>
	);

	private update = (value: string): void => {
		this.props.onUpdate?.({
			name: this.props.name,
			value,
		});

		this.props.onChange?.(value);
	};
}
