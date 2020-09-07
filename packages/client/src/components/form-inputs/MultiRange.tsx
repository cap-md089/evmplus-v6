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

import './MultiRange.css';

interface MultiRangeProps extends InputProps<[number, number]> {
	min: number;
	max: number;
	step?: number;
	leftDisplay?: (valueLow: number, valueHigh: number) => React.ReactChild;
	rightDisplay?: (valueLow: number, valueHigh: number) => React.ReactChild;
}

export default class MultiRange extends React.Component<
	MultiRangeProps,
	{
		low: number;
		high: number;
	}
> {
	private range: HTMLInputElement | null = null;

	constructor(props: MultiRangeProps) {
		super(props);

		const { min, max } = this.props;
		if (typeof this.props.value !== 'undefined') {
			this.state = {
				low: ((this.props.value[0] - min) / (max - min)) * 100,
				high: ((this.props.value[1] - min) / (max - min)) * 100,
			};
		} else {
			this.state = {
				low: 0,
				high: 100,
			};
		}
		const { low, high } = this.state;
		const parsedLow = (low / 100) * (max - min) + min;
		const parsedHigh = (high / 100) * (max - min) + min;

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: props.name,
				value: [parsedLow, parsedHigh],
			});
		}

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: [parsedLow, parsedHigh],
			});
		}
	}

	public componentDidMount() {
		if (!this.range) {
			return;
		}

		const input = this.range;
		const ghost = input.cloneNode() as HTMLInputElement;

		input.classList.add('multirange', 'original');
		ghost.classList.add('multirange', 'ghost');

		input.value = this.state.low.toString();
		ghost.value = this.state.high.toString();

		(input.parentElement as HTMLDivElement).insertBefore(ghost, input.nextSibling);

		const update = () => {
			const high = Math.max(+input.value, +ghost.value);
			const low = Math.min(+input.value, +ghost.value);

			const { min, max } = this.props;
			const parsedLow = (low / 100) * (max - min) + min;
			const parsedHigh = (high / 100) * (max - min) + min;

			this.setState({
				high,
				low,
			});

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: [parsedLow, parsedHigh],
				});
			}

			if (this.props.onChange) {
				this.props.onChange([parsedLow, parsedHigh]);
			}

			ghost.style.setProperty('--low', low + 1 + '%');
			ghost.style.setProperty('--high', high - 1 + '%');
		};

		input.addEventListener('input', update);
		ghost.addEventListener('input', update);

		input.addEventListener('change', update);
		ghost.addEventListener('change', update);

		update();
	}

	public render() {
		const { min, max } = this.props;
		const parsedLow = (this.state.low / 100) * (max - min) + min;
		const parsedHigh = (this.state.high / 100) * (max - min) + min;

		return (
			<div className="input-formbox">
				{this.props.leftDisplay ? (
					<div className="multirange-leftdisplay">
						{this.props.leftDisplay(parsedLow, parsedHigh)}
					</div>
				) : null}
				<input
					type="range"
					defaultValue={`${this.state.low},${this.state.high}`}
					ref={el => {
						this.range = el;
					}}
					step={this.props.step || 1}
				/>
				{this.props.rightDisplay ? (
					<div className="multirange-rightdisplay">
						{this.props.rightDisplay(parsedLow, parsedHigh)}
					</div>
				) : null}
			</div>
		);
	}
}
