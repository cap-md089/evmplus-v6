/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { ReactNode, PureComponent } from 'react';
import jQuery from 'jquery';
import './DropDownList.css';
import { alwaysFalse } from 'common-lib';

interface DropDownListProps<T> {
	open?: boolean[];
	onOpen?: (index: number) => void;
	onClose?: (index: number) => void;

	onlyOneOpen?: boolean;

	titles: (value: T, index: number, array: T[]) => ReactNode;
	children: (value: T, index: number, array: T[]) => ReactNode;
	values: T[];

	keyFunc?: (val: T, index: number, array: T[]) => string;
}

interface DropDownListState<T> {
	open: boolean[];
	previousValues: T[];
}

const toString = (val: unknown): string => String(val);

export default class DropDownList<T> extends PureComponent<
	DropDownListProps<T>,
	DropDownListState<T>
> {
	public state: DropDownListState<T> = {
		open: this.props.values.map(() => false),
		previousValues: [...this.props.values],
	};

	private divRefs: Array<HTMLDivElement | null> = [];
	private arrowRefs: Array<HTMLDivElement | null> = [];

	private get onlyOneOpen(): boolean {
		return this.props.onlyOneOpen ?? false;
	}

	private get keyFunc(): (val: T, ind: number, fullArr: T[]) => string {
		return this.props.keyFunc ?? toString;
	}

	public static getDerivedStateFromProps<U>(
		props: DropDownListProps<U>,
		state: DropDownListState<U>,
	): DropDownListState<U> | null {
		let open = props.open ?? state.open;

		if (open.length !== props.values.length) {
			open = props.values.map(val =>
				state.previousValues.includes(val)
					? state.open[state.previousValues.indexOf(val)]
					: false,
			);
		}

		return {
			open,
			previousValues: props.values,
		};
	}

	public render = (): JSX.Element => (
		<ul className="detailedlistplus">
			{this.props.values.map((val, ind, arr) => (
				<li key={`${ind}-${this.keyFunc(val, ind, arr)}`}>
					<div
						className={`detailedlistplusrow ${
							this.state.open[ind] ? 'open' : 'closed'
						}`}
					>
						<div
							className={`detailedlistplusarrow ${
								this.state.open[ind] ? 'down' : ''
							}`}
							onClick={this.getToggleOpener(ind)}
							ref={ref => (this.arrowRefs[ind] = ref)}
						/>
						<div className="detailedlistplusname" onClick={this.getToggleOpener(ind)}>
							{this.props.titles(val, ind, arr)}
						</div>
					</div>
					<div className="detailedlistplusdesc" ref={ref => (this.divRefs[ind] = ref)}>
						{this.props.children(val, ind, arr)}
					</div>
				</li>
			))}
		</ul>
	);

	private getToggleOpener = (index: number) => () => {
		if (this.state.open[index]) {
			const ref = this.divRefs[index];
			if (ref !== null) {
				const arrowRef = this.arrowRefs[index];
				if (arrowRef !== null) {
					jQuery(arrowRef).removeClass('down');
				}
				jQuery(ref).slideUp(400, 'swing', () => {
					const open = this.onlyOneOpen
						? this.state.open.map(alwaysFalse)
						: this.state.open.slice();

					open[index] = false;

					this.setState({ open }, () => {
						if (this.props.onClose) {
							this.props.onClose(index);
						}
					});
				});
			}
		} else {
			const ref = this.divRefs[index];
			if (ref !== null) {
				const arrowRef = this.arrowRefs[index];
				if (arrowRef !== null) {
					jQuery(arrowRef).addClass('down');
				}

				if (this.onlyOneOpen) {
					this.arrowRefs.forEach(arrRef => {
						if (arrRef !== null && arrRef !== arrowRef) {
							jQuery(arrRef).removeClass('down');
						}
					});
					this.divRefs.forEach(divRef => {
						if (divRef !== null && divRef !== ref) {
							jQuery(divRef).slideUp(400);
						}
					});
				}

				jQuery(ref).slideDown(400, 'swing', () => {
					const open = this.onlyOneOpen
						? this.state.open.map(alwaysFalse)
						: this.state.open.slice();

					open[index] = true;

					this.setState({ open }, () => {
						if (this.props.onOpen) {
							this.props.onOpen(index);
						}
					});
				});
			}
		}
	};
}
