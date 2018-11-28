import * as React from 'react';

import './DateTimeInput.css';

import { InputProps } from './Input';

import { DateTime } from 'luxon';

const TimeZoneDisplays = {
	'America/New_York': 'EST',
	'America/Chicago': 'CST',
	'America/Denver': 'MST',
	'America/Los_Angeles': 'PST',
	'America/Arizona': 'Arizona',
	'America/Anchorage': 'Alaska',
	'Pacific/Hawaii': 'Hawaii'
};

type SupportedTimeZones = keyof typeof TimeZoneDisplays;

// We don't want it to throw an error with value being a moment or a number
// @ts-ignore
export interface DateTimeInputProps extends InputProps<number> {
	value?: DateTime | number;
	date: boolean;
	time: boolean;
	minuteInterval?: number;
	originalTimeZoneOffset: SupportedTimeZones;
}

// @ts-ignore
export interface TimeInputProps extends DateTimeInputProps {
	value?: DateTime | number; // Make it required to specify day
	date: false;
	time: true;
}

// @ts-ignore
export interface DateInputProps extends DateTimeInputProps {
	date: true;
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

// const getMonth = (month: number, year: number) =>
// 	DateTime.utc()
// 		.set({
// 			year,
// 			month
// 		})
// 		.startOf('month');

const normalizeInput = (
	value: number | DateTime | undefined,
	offset: SupportedTimeZones
) =>
	typeof value !== 'undefined'
		? typeof value === 'number'
			? DateTime.fromMillis(value * 1000, {
					zone: offset
			  })
			: value
		: DateTime.utc();

const quickNormalize = (
	props: DateTimeInputProps | TimeInputProps | DateInputProps
) =>
	roundInput(
		normalizeInput(props.value, props.originalTimeZoneOffset),
		props.minuteInterval || FIVE_MINUTES,
		props.originalTimeZoneOffset
	);

const FIVE_MINUTES = 5 * 60 * 1000;

const roundInput = (
	input: DateTime,
	interval: number,
	offset: SupportedTimeZones
) =>
	DateTime.fromMillis(Math.round(+input / interval) * interval, {
		zone: offset
	});

// short left pad
const lp = (v: string | number, amount = 2) => ('0000' + v).substr(-amount);

export default class DateTimeInput extends React.Component<
	DateTimeInputProps | TimeInputProps | DateInputProps,
	DateTimeState
> {
	constructor(props: DateTimeInputProps | TimeInputProps | DateInputProps) {
		super(props);

		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

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
	}

	public render() {
		const start = roundInput(
			normalizeInput(this.props.value, this.props.originalTimeZoneOffset),
			this.props.minuteInterval || FIVE_MINUTES,
			this.props.originalTimeZoneOffset
		);

		const sameTimezone = DateTime.local().offset === start.offset;

		const className =
			(this.props.date ? 'date' : '') + (this.props.time ? 'time' : '');

		return (
			<div className="formbox" style={this.props.boxStyles}>
				<div className={`${className}-input-box datetime-input-root`}>
					<div>
						{this.props.date ? (
							<input
								className="date-input"
								value={`${lp(start.year, 4)}-${lp(
									start.month
								)}-${lp(start.day)}`}
								type="date"
								onChange={this.onChangeDate}
							/>
						) : null}
						{this.props.date && this.props.time ? (
							<span className="datetime-input-seperator">
								&nbsp;
							</span>
						) : null}
						{this.props.time ? (
							<input
								className="time-input"
								value={`${lp(start.hour)}:${lp(start.minute)}`}
								type="time"
								onChange={this.onChangeTime}
							/>
						) : null}
					</div>
					{!sameTimezone ? (
						<>
							<br />
							<div className="original-time">
								Time displayed in{' '}
								{
									TimeZoneDisplays[
										this.props.originalTimeZoneOffset
									]
								}
							</div>
						</>
					) : null}
				</div>
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

	private onChangeDate(e: React.ChangeEvent<HTMLInputElement>) {
		const input = quickNormalize(this.props);

		if (e.currentTarget.value === '') {
			this.forceUpdate();
		}

		const value = e.currentTarget.value.split('-');

		const result = input.set({
			year: parseInt(value[0], 10),
			month: parseInt(value[1], 10),
			day: parseInt(value[2], 10)
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: +result
			});
		}

		if (this.props.onChange) {
			this.props.onChange(+result);
		}
	}

	private onChangeTime(e: React.ChangeEvent<HTMLInputElement>) {
		const input = quickNormalize(this.props);

		if (e.currentTarget.value === '') {
			this.forceUpdate();
		}

		const value = e.currentTarget.value.split(':');

		const result = input.set({
			hour: parseInt(value[0], 10),
			minute: parseInt(value[1], 10)
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: +result
			});
		}

		if (this.props.onChange) {
			this.props.onChange(+result);
		}
	}
}
