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
	'America/Puerto_Rico': 'Puerto Rico'
};

type SupportedTimeZones = keyof typeof TimeZoneDisplays;

// We don't want it to throw an error with value being a moment or a number
export interface DateTimeInputProps extends InputProps<number> {
	value?: number;
	time: boolean;
	minuteInterval?: number;
	originalTimeZoneOffset: SupportedTimeZones;
}

// @ts-ignore
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
	'December'
];

interface DateTimeState {
	guiOpen: boolean;
	guiCurrentMonth: number;
	guiCurrentYear: number;
	focused: boolean;
}

const normalizeInput = (value: number | DateTime | undefined, offset: SupportedTimeZones) =>
	typeof value !== 'undefined' && value !== null ? DateTime.fromMillis(+value) : DateTime.local();

export default class DateTimeInput extends React.Component<
	DateTimeInputProps | DateInputProps,
	DateTimeState
> {
	constructor(props: DateTimeInputProps | DateInputProps) {
		super(props);

		const start = this.props.value ? DateTime.fromMillis(+this.props.value) : DateTime.utc();

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: +start
			});
		}

		this.state = {
			guiOpen: false,
			guiCurrentMonth: start.month,
			guiCurrentYear: start.year,
			focused: false
		};

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);

		this.onChangeDate = this.onChangeDate.bind(this);
		this.onChangeTime = this.onChangeTime.bind(this);
		this.onChange = this.onChange.bind(this);
	}

	public render() {
		const start = normalizeInput(this.props.value, this.props.originalTimeZoneOffset);

		// @ts-ignore
		const currentZone: SupportedTimeZones = start.zone.name;

		// const sameTimezone = start.offsetNameShort === DateTime.local().offsetNameShort;
		// @ts-ignore
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

	private onFocus() {
		this.setState({
			focused: true
		});
	}

	private onBlur() {
		this.setState({
			focused: false
		});
	}

	private onChange(date: Date) {
		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: +date
			});
		}

		if (this.props.onChange) {
			this.props.onChange(+date);
		}
	}

	private onChangeDate(e: React.ChangeEvent<HTMLInputElement>) {
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
	}

	private onChangeTime(e: React.ChangeEvent<HTMLInputElement>) {
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
	}
}
