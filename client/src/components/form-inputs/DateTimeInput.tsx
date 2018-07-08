import * as React from 'react';

import './DateTimeInput.css';

import { InputProps } from './Input';
import * as moment from 'moment';
// import * as momentTimezone from 'moment-timezone';

// We don't want it to throw an error with value being a moment or a number
// @ts-ignore
export interface TimeInputProps extends InputProps<moment.Moment> {
	value: moment.Moment | number;
	date: false;
	time: true;
	minuteInterval?: number;
}

// @ts-ignore
export interface DateInputProps extends InputProps<moment.Moment> {
	value: moment.Moment | number;
	date: true;
	time: false;
	minuteInterval?: never;
}

// @ts-ignore
export interface DateTimeInputProps extends InputProps<moment.Moment> {
	value?: moment.Moment | number;
	date: true;
	time: true;
	minuteInterval?: number;
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
	currentInput: moment.Moment;
	currentYear: number;
	currentMonth: number;
	currentDay: number;
	currentHour: number;
	currentMinute: number;
	focused: boolean;
}

const getMonth = (month: number, year: number) => moment().set('month', month).set('year', year).startOf('month');

export default class DateTimeInput extends React.Component<
	DateTimeInputProps | TimeInputProps | DateInputProps,
	DateTimeState
> {
	constructor(props: DateTimeInputProps | TimeInputProps | DateInputProps) {
		super(props);

		let start = typeof this.props.value !== 'undefined' ?
			(typeof this.props.value === 'number' ? moment(this.props.value) : this.props.value) :
			moment();

		let interval = this.props.minuteInterval || 5 * 60 * 1000;
		start = moment(Math.round(+start / interval) * interval);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: start
			});
		}

		this.state = {
			guiOpen: false,
			guiCurrentMonth: start.get('month'),
			guiCurrentYear: start.get('year'),
			currentInput: start,
			currentYear: start.get('year'),
			currentMonth: start.get('month') + 1,
			currentDay: start.get('date'),
			currentHour: start.get('hour'),
			currentMinute: start.get('minute'),
			focused: false
		};

		this.updateDateDay = this.updateDateDay.bind(this);
		this.updateDateMonth = this.updateDateMonth.bind(this);
		this.updateDateYear = this.updateDateYear.bind(this);

		this.updateTimeMinutes = this.updateTimeMinutes.bind(this);
		this.updateTimeHours = this.updateTimeHours.bind(this);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);

		this.onMinuteBlur = this.onMinuteBlur.bind(this);
		this.onYearBlur = this.onYearBlur.bind(this);

		this.openGui = this.openGui.bind(this);
		this.closeGui = this.closeGui.bind(this);
	}

	public render () {
		const className = 
			(this.props.date ? 'date' : '') +
			(this.props.time ? 'time' : '');

		return (
			<div className="formbox">
				<div
					className={
						`${className}-input-box 
						datetime-input-root
						${this.state.focused ? ' focused' : ''}
						${this.state.guiOpen ? ' gui-open' : ''}`}
				>
					<div>
						{
							this.props.date ?
								<>
									<input
										className="date-input-year"
										placeholder="----"
										value={this.state.currentYear}
										onChange={this.updateDateYear}
										onFocus={this.onFocus}
										onBlur={() => {
											this.onBlur();
											this.onYearBlur();
										}}
									/>
									<span className="datetime-input-seperator">/</span>
									<input
										className="date-input-month"
										placeholder="--"
										value={this.state.currentMonth}
										onChange={this.updateDateMonth}
										onFocus={this.onFocus}
										onBlur={this.onBlur}
									/>
									<span className="datetime-input-seperator">/</span>
									<input
										className="date-input-day"
										placeholder="--"
										value={this.state.currentDay}
										onChange={this.updateDateDay}
										onFocus={this.onFocus}
										onBlur={this.onBlur}
									/>
								</> :
								null
						}
						{
							this.props.date && this.props.time ?
								<span className="datetime-input-seperator">&nbsp;</span>  :
								null
						}
						{
							this.props.time ?
								<>
									<input
										className="time-input-hour"
										placeholder="--"
										value={this.state.currentHour}
										onChange={this.updateTimeHours}
										onFocus={this.onFocus}
										onBlur={this.onBlur}
									/>
									<span className="datetime-input-seperator">:</span>
									<input
										className="time-input-minute"
										placeholder="--"
										value={this.state.currentMinute}
										onChange={this.updateTimeMinutes}
										onFocus={this.onFocus}
										onBlur={() => {
											this.onBlur();
											this.onMinuteBlur();
										}}
									/>
								</> :
								null
						}
						{
							this.props.date ?
								<button
									className="date-input-opendialogue"
									onFocus={this.onFocus}
									onBlur={this.onBlur}
									onClick={this.openGui}
								/>
								: null
						}
						{
							this.props.time ?
								<button
									className="time-input-opendialogue"
									onFocus={this.onFocus}
									onBlur={this.onBlur}
									onClick={this.openGui}
								/>
								: null
						}
					</div>
					{
						this.state.guiOpen ? 
						(
							this.renderCalendar()
						) : null
					}
				</div>
			</div>
		);
	}

	private updateDateYear (e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.value === '') {
			this.setState({
				currentYear: 0
			});
			return;
		}

		if (moment(e.target.value).isValid()) {
			this.setStateFromMoment(moment(e.target.value));
			return;
		}

		let test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test > 9999 || test < 0) {
			this.forceUpdate();
			return;
		}

		let { currentInput } = this.state;

		currentInput.set('year', test);

		this.setState({
			currentInput,
			currentYear: test
		});
	}

	private updateDateMonth (e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.value === '') {
			this.setState({
				currentMonth: 0
			});
			return;
		}

		if (moment(e.target.value).isValid()) {
			this.setStateFromMoment(moment(e.target.value));
			return;
		}

		let test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test > 12 || test < 1) {
			this.forceUpdate();
			return;
		}

		let { currentInput } = this.state;

		currentInput.set('month', test - 1);

		if (currentInput.daysInMonth() < this.state.currentDay) {
			this.setState({
				currentDay: currentInput.daysInMonth()
			});
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: currentInput
			});
		}

		this.setState({
			currentInput,
			currentMonth: test
		});
	}

	private updateDateDay (e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.value === '') {
			this.setState({
				currentDay: 0
			});
			return;
		}

		if (moment(e.target.value).isValid()) {
			this.setStateFromMoment(moment(e.target.value));
			return;
		}

		let { currentInput } = this.state;
		let test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test > currentInput.daysInMonth() || test < 1) {
			this.forceUpdate();
			return;
		}

		currentInput.set('date', test);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: currentInput
			});
		}

		this.setState({
			currentInput,
			currentDay: test
		});
	}

	private updateTimeHours (e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.value === '') {
			this.setState({
				currentHour: 0
			});
			return;
		}

		if (moment(e.target.value).isValid()) {
			this.setStateFromMoment(moment(e.target.value));
			return;
		}

		let test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test === 24) {
			test = 0;
		}

		if (test > 23 || test < 0) {
			this.forceUpdate();
			return;
		}

		let { currentInput } = this.state;

		currentInput.set('hour', test);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: currentInput
			});
		}

		this.setState({
			currentInput,
			currentHour: test
		});
	}

	private updateTimeMinutes (e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.value === '') {
			this.setState({
				currentMinute: 0
			});
			return;
		}

		if (moment(e.target.value).isValid()) {
			this.setStateFromMoment(moment(e.target.value));
			return;
		}

		let test = parseInt(e.target.value, 10);

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test < 0 || test > 59) {
			this.forceUpdate();
			return;
		}

		let { currentInput } = this.state;

		if (test >= 10) {
			test = Math.round(test / 5) * 5;
		}

		currentInput.set('minute', test);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: currentInput
			});
		}

		this.setState({
			currentInput,
			currentMinute: test
		});
	}

	private onFocus () {
		this.setState({
			focused: true
		});
	}

	private onBlur () {
		this.setState({
			focused: false
		});
	}

	private onMinuteBlur () {
		let test = this.state.currentMinute;

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}

		if (test < 0 || test > 59) {
			this.forceUpdate();
			return;
		}

		let { currentInput } = this.state;

		currentInput.set('minute', test);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: currentInput
			});
		}

		this.setState({
			currentInput,
			currentMinute: test
		});
	}

	private onYearBlur () {
		let test = this.state.currentYear;

		if (test !== test) {
			// NaN
			this.forceUpdate();
			return;
		}
		
		let { currentInput } = this.state;

		if (test >= 0 && test < 100) {
			if (test >= moment().add('2 years').get('year')) {
				test = 1900 + test;
			} else {
				test = 2000 + test;
			}
		}

		currentInput.set('minute', test);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: currentInput
			});
		}

		this.setState({
			currentInput,
			currentYear: test
		});
	}

	private setStateFromMoment (start: moment.Moment) {
		let interval = this.props.minuteInterval || 5 * 60 * 1000;
		start = moment(Math.round(+start / interval) * interval);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: start
			});
		}

		this.setState({
			guiOpen: false,
			currentInput: start,
			currentYear: start.get('year'),
			currentMonth: start.get('month') + 1,
			currentDay: start.get('date'),
			currentHour: start.get('hour'),
			currentMinute: start.get('minute'),
			focused: false
		});
	}

	private openGui() {
		this.setState({
			guiOpen: true
		});
	}
	
	private closeGui() {
		this.setState({
			guiOpen: false
		});
	}

	private renderCalendar () {
		const className = 
			(this.props.date ? 'date' : '') +
			(this.props.time ? 'time' : '');

		const year = this.state.guiCurrentYear;
		const month = this.state.guiCurrentMonth;

		const lastMonth = getMonth(month - 1, year).endOf('month');
		const thisMonth = getMonth(month    , year);
		const nextMonth = getMonth(month + 1, year);

		const firstDay = thisMonth.isoWeekday() % 7;

		const numberWeeks = Math.ceil((thisMonth.daysInMonth() + thisMonth.isoWeekday() % 7) / 7) + 1;

		const calendar: Array<{
			day: number,
			month: number,
			year: number
		}>[] = [];

		const startOfLastMonthWeek = lastMonth.startOf('week');
		let j, i;

		calendar[0] = [];
		for (i = 0; i < firstDay; i++) {
			calendar[0][i] = {
				day: startOfLastMonthWeek.get('date') + i,
				month: lastMonth.get('month'),
				year: lastMonth.get('year')
			};
		}

		for (i = firstDay; i < 7; i++) {
			calendar[0][i] = {
				day: i - firstDay + 1,
				month: thisMonth.get('month'),
				year: thisMonth.get('year')
			};
		}

		let start: number;

		for (i = 1; i < numberWeeks - 2; i++) {
			start = calendar[i - 1][6].day + 1;
			calendar[i] = [];
			for (j = 0; j < 7; j++) {
				calendar[i][j] = {
					day: start + j,
					month: thisMonth.get('month'),
					year: thisMonth.get('year')
				};
			}
		}

		start = calendar[calendar.length - 1][6].day + 1;
		calendar[calendar.length] = [];
		for (i = start, j = 0; i <= thisMonth.daysInMonth(); i++, j++) {
			calendar[calendar.length - 1][j] = {
				day: i,
				month: thisMonth.get('month'),
				year: thisMonth.get('year')
			};
		}

		if (j !== 7) {
			for (i = 1; j < 7; i++, j++) {
				calendar[calendar.length - 1][j] = {
					day: i,
					month: nextMonth.get('month'),
					year: nextMonth.get('year')
				};
			}
		}

		return (
			<div className={`${className}-input-gui-box datetime-input-gui-root`}>
				<div className="datetime-gui-parent">
					<div className="date-picker">
						<table>
							<caption>
								{this.state.guiCurrentYear} {MONTHS[this.state.guiCurrentMonth]}
							</caption>
							<tbody>
								{
									calendar.map(row => (
										<tr>
											{
												row.map(item => (
													<td
														className={item.month === thisMonth.get('month') ? 'datetime-gui-inmonth' : 'datetime-gui-outmonth'}
													>
														{item.day}
													</td>
												))
											}
										</tr>
									))
								}
							</tbody>
						</table>
					</div>
					<div className="time-picker">
						2
					</div>
				</div>
			</div>
		);
	}
}