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

import { InputProps } from './Input';
import * as React from 'react';
import './Select.css';

export interface SelectProps<E extends number> extends InputProps<E | -1> {
	labels: string[];
}

export default class Select<E extends number = number> extends React.Component<SelectProps<E>> {
	public state: {} = {};

	public constructor(props: SelectProps<E>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: typeof this.props.value !== 'number' ? -1 : this.props.value,
			});
		}

		this.selectChange = this.selectChange.bind(this);
	}

	public render = (): JSX.Element => (
		<div className="input-formbox" style={this.props.boxStyles}>
			<select
				className="select"
				value={(typeof this.props.value === 'undefined'
					? '-1'
					: this.props.value
				).toString()}
				onChange={this.selectChange}
			>
				{this.props.labels.map((label, i) => (
					<option key={i} value={i.toString()}>
						{label}
					</option>
				))}
			</select>
		</div>
	);

	private selectChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		const value = parseInt(event.currentTarget.value.toString(), 10) as E;

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value,
			});
		}
	};
}
