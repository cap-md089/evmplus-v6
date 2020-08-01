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

import * as React from 'react';
import './Button.scss';

export interface ButtonProps {
	className?: string;
	id?: string;
	disabled?: boolean;

	useData?: false;

	/**
	 * Called when the button is clicked, passes the data given to it
	 */
	onClick?: () => void;

	buttonType?: 'primaryButton' | 'secondaryButton' | ('none' | '');
}

export interface ButtonPropsWithData<C> {
	className?: string;
	id?: string;
	disabled?: boolean;

	useData: true;
	/**
	 * Data to use on button press
	 */
	data: C;

	/**
	 * Called when the button is clicked, passes the data given to it
	 */
	onClick?: (data: C) => void;

	buttonType?: 'primaryButton' | 'secondaryButton' | ('none' | '');
}

export default class Button<C> extends React.Component<
	ButtonPropsWithData<C> | ButtonProps,
	{
		disabled: boolean;
	}
> {
	constructor(props: ButtonPropsWithData<C> | ButtonProps) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
		this.state = {
			disabled: false
		};
	}

	public handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		if (this.props.onClick) {
			if (this.props.useData) {
				this.props.onClick(this.props.data);
			} else {
				this.props.onClick();
			}
		}
	}

	public render() {
		return (
			<button
				onClick={this.handleClick}
				className={
					(this.props.buttonType === 'none' ? 'linkButton ' : '') +
					(typeof this.props.buttonType === 'string'
						? ` ${this.props.buttonType}`
						: 'primaryButton') +
					(this.props.className ? ` ${this.props.className}` : ' asyncButton') +
					(this.props.disabled ? ' disabled' : '')
				}
			>
				{this.props.children}
			</button>
		);
	}
}
