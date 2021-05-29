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

import './DateTimeInput.css';

import { InputProps } from './Input';

import { DateTime } from 'luxon';

import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Timezone } from 'common-lib';

const TimeZoneDisplays: { [P in Timezone]: string } = {
	'America/New_York': 'EST',
	'America/Chicago': 'CST',
	'America/Denver': 'MST',
	'America/Los_Angeles': 'PST',
	'America/Arizona': 'Arizona',
	'America/Anchorage': 'Alaska',
	'America/Hawaii': 'Hawaii',
	'America/Puerto_Rico': 'Puerto Rico',
};

type SupportedTimeZones = keyof typeof TimeZoneDisplays;

// We don't want it to throw an error with value being a moment or a number
export interface DateTimeInputProps extends InputProps<number> {
	value?: number;
	time: boolean;
	minuteInterval?: number;
	originalTimeZoneOffset: SupportedTimeZones;
}

export interface DateInputProps extends DateTimeInputProps {
	time: false;
}

export const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

interface DateTimeState {
	guiOpen: boolean;
	guiCurrentMonth: number;
	guiCurrentYear: number;
	focused: boolean;
}

const normalizeInput = (value: number | DateTime | undefined): DateTime =>
	typeof value !== 'undefined' && value !== null ? DateTime.fromMillis(+value) : DateTime.local();

export default class DateTimeInput extends React.Component<
	DateTimeInputProps | DateInputProps,
	DateTimeState
> {
	public constructor(props: DateTimeInputProps | DateInputProps) {
		super(props);

		const start = this.props.value ? DateTime.fromMillis(+this.props.value) : DateTime.utc();

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: +start,
			});
		}

		this.state = {
			guiOpen: false,
			guiCurrentMonth: start.month,
			guiCurrentYear: start.year,
			focused: false,
		};

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);

		this.onChangeDate = this.onChangeDate.bind(this);
		this.onChangeTime = this.onChangeTime.bind(this);
		this.onChange = this.onChange.bind(this);
	}

	public render(): JSX.Element {
		const start = normalizeInput(this.props.value);

		const currentZone = ((start as unknown) as {
			zone: { name: SupportedTimeZones };
		}).zone.name;

		// const sameTimezone = start.offsetNameShort === DateTime.local().offsetNameShort;
		const sameTimezone = currentZone === this.props.originalTimeZoneOffset;

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<ReactDatePicker
					onChange={this.onChange}
					selected={new Date(+start)}
					showTimeSelect={this.props.time}
					timeIntervals={this.props.minuteInterval || 15}
					dateFormat={this.props.time ? 'MM/dd/yyyy HH:mm' : 'MM/dd/yyyy'}
				/>
				{this.props.hasError && this.props.errorMessage ? (
					<span className="text-error">{this.props.errorMessage}</span>
				) : null}
				{!sameTimezone ? (
					<>
						<br />
						<div className="original-time">
							<i>
								Time is for {TimeZoneDisplays[this.props.originalTimeZoneOffset]}.
								Rendered in local time, {TimeZoneDisplays[currentZone]}
							</i>
						</div>
					</>
				) : null}
			</div>
		);
	}

	private onFocus = (): void => {
		this.setState({
			focused: true,
		});
	};

	private onBlur = (): void => {
		this.setState({
			focused: false,
		});
	};

	private onChange = (date: Date): void => {
		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: +date,
			});
		}

		if (this.props.onChange) {
			this.props.onChange(+date);
		}
	};

	private onChangeDate = (): void => {
		// const input = quickNormalize(this.props);
		// if (e.currentTarget.value === '') {
		// 	this.forceUpdate();
		// }
		// const value = e.currentTarget.value.split('-');
		// const result = input.set({
		// 	year: parseInt(value[0], 10),
		// 	month: parseInt(value[1], 10),
		// 	day: parseInt(value[2], 10)
		// });
		// if (this.props.onUpdate) {
		// 	this.props.onUpdate({
		// 		name: this.props.name,
		// 		value: +result
		// 	});
		// }
		// if (this.props.onChange) {
		// 	this.props.onChange(+result);
		// }
	};

	private onChangeTime = (): void => {
		// const input = quickNormalize(this.props);
		// if (e.currentTarget.value === '') {
		// 	this.forceUpdate();
		// }
		// const value = e.currentTarget.value.split(':');
		// const result = input.set({
		// 	hour: parseInt(value[0], 10),
		// 	minute: parseInt(value[1], 10)
		// });
		// if (this.props.onUpdate) {
		// 	this.props.onUpdate({
		// 		name: this.props.name,
		// 		value: +result
		// 	});
		// }
		// if (this.props.onChange) {
		// 	this.props.onChange(+result);
		// }
	};
}
