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
import './Checkbox.scss';
import { InputProps } from './Input';

export default class Checkbox extends React.Component<InputProps<boolean>> {
	public constructor(props: InputProps<boolean>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: !!this.props.value,
			});
		}
	}

	public render(): JSX.Element {
		const name = !!this.props.index
			? `${this.props.name}-${this.props.index}`
			: this.props.name;

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<div className="checkboxDiv">
					<input
						type="checkbox"
						checked={!!this.props.value}
						onChange={this.onChange}
						name={this.props.name}
						id={name}
						disabled={this.props.disabled}
					/>
					<label htmlFor={name} className={this.props.disabled ? 'disabled' : ''} />
				</div>
			</div>
		);
	}

	private onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		if (this.props.disabled) {
			return;
		}

		const value = e.currentTarget.checked;

		this.props.onUpdate?.({
			name: this.props.name,
			value,
		});

		this.props.onChange?.(value);
	};
}
