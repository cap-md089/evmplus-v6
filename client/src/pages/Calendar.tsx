import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import myFetch from '../lib/myFetch';
import './Calendar.css';
import Page, { PageProps } from './Page';

const getMonth = (month: number, year: number) =>
	DateTime.utc()
		.set({
			year,
			month
		})
		.startOf('month');

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

export default class Calendar extends Page<
	PageProps<{ month?: string; year?: string }>,
	{
		events: EventObject[] | null;
	}
> {
	public state = {
		events: null
	};

	public render() {
		return this.state.events === null ? (
			<Loader />
		) : (
			this.renderCalendar(this.state.events!)
		);
	}

	public componentDidMount() {
		const year =
			typeof this.props.routeProps.match.params.year === 'undefined'
				? new Date().getUTCFullYear()
				: parseInt(this.props.routeProps.match.params.year, 10);
		const month =
			typeof this.props.routeProps.match.params.month === 'undefined'
				? new Date().getUTCMonth() + 1
				: parseInt(this.props.routeProps.match.params.month, 10);

		const lastMonth = DateTime.fromMillis(+getMonth(month, year) - 1);
		const nextMonth = getMonth(month + 1, year);

		const startOfLastMonthWeek =
			lastMonth.startOf('week').day === lastMonth.day - 6
				? lastMonth
				: lastMonth.startOf('week');
		const endOfNextMonth = nextMonth.endOf('week');

		myFetch(
			`/api/event/${Math.round(
				+startOfLastMonthWeek / 1000
			)}/${Math.round(+endOfNextMonth / 1000)}`,
			{
				headers: {
					authorization: this.props.member.sessionID
				}
			}
		)
			.then(res => res.json())
			.then((events: EventObject[]) => this.setState({ events }));
	}

	private renderCalendar(events: EventObject[]) {
		const year =
			typeof this.props.routeProps.match.params.year === 'undefined'
				? new Date().getUTCFullYear()
				: parseInt(this.props.routeProps.match.params.year, 10);
		const month =
			typeof this.props.routeProps.match.params.month === 'undefined'
				? new Date().getUTCMonth() + 1
				: parseInt(this.props.routeProps.match.params.month, 10);

		const lastMonth = DateTime.fromMillis(+getMonth(month, year) - 1);
		const thisMonth = getMonth(month, year);
		const nextMonth = getMonth(month + 1, year);

		const firstDay = thisMonth.weekday % 7;

		const numberWeeks =
			Math.ceil((thisMonth.daysInMonth + (thisMonth.weekday % 7)) / 7) +
			1;

		const calendar: Array<
			Array<{
				day: number;
				month: number;
				year: number;
				events: Array<{
					event: EventObject;
					mergeLeft: boolean;
					mergeRight: boolean;
					first: boolean;
				}>;
			}>
		> = [];

		const weird = lastMonth.startOf('week').day === lastMonth.day - 6;

		const startOfLastMonthWeek = weird
			? lastMonth
			: lastMonth.startOf('week');

		let j;
		let i;

		calendar[0] = [];
		for (i = 0; i < firstDay; i++) {
			calendar[0][i] = {
				day: startOfLastMonthWeek.day + i - (weird ? 0 : 1),
				month: lastMonth.month,
				year: lastMonth.year,
				events: []
			};
		}

		for (i = firstDay; i < 7; i++) {
			calendar[0][i] = {
				day: i - firstDay + 1,
				month: thisMonth.month,
				year: thisMonth.year,
				events: []
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
					year: thisMonth.get('year'),
					events: []
				};
			}
		}

		start = calendar[calendar.length - 1][6].day + 1;
		calendar[calendar.length] = [];
		for (i = start, j = 0; i <= thisMonth.daysInMonth; i++, j++) {
			calendar[calendar.length - 1][j] = {
				day: i,
				month: thisMonth.get('month'),
				year: thisMonth.get('year'),
				events: []
			};
		}

		if (j !== 7) {
			for (i = 1; j < 7; i++, j++) {
				calendar[calendar.length - 1][j] = {
					day: i,
					month: nextMonth.get('month'),
					year: nextMonth.get('year'),
					events: []
				};
			}
		}

		events.sort(
			(a, b) =>
				b.endDateTime -
				b.pickupDateTime -
				(a.endDateTime - a.pickupDateTime)
		);

		events = events.reverse();

		events.forEach(val => {
			const startDate = DateTime.fromMillis(val.meetDateTime * 1000);
			const endDate = DateTime.fromMillis(val.pickupDateTime * 1000);

			let startWeek = 0;
			let startDay = 0;

			let endWeek = 0;
			let endDay = 0;

			if (startDate < thisMonth) {
				startWeek = 0;
				startDay =
					+startDate + 7 * 24 * 3600 * 1000 < +thisMonth
						? 0
						: startDate.weekday;
			} else if (startDate < nextMonth) {
				startWeek = Math.ceil((startDate.day - startDate.weekday) / 7);
				startDay = startDate.weekday;
			} else {
				startWeek = calendar.length - 1;
				startDay = startDate.weekday;
			}

			if (endDate > nextMonth) {
				const nextWeek = +nextMonth + 7 * 24 * 3600 * 1000;
				endWeek = calendar.length - 1;
				endDay =
					+endDate > nextWeek ? 6 : endDate.weekday;
			} else if (endDate > thisMonth) {
				endWeek = Math.ceil((endDate.day - endDate.weekday) / 7);
				endDay = endDate.weekday;
			} else {
				endWeek = 0;
				endDay = endDate.weekday;
			}

			let eventIndex: number = 0;
			const eventList = calendar[startWeek][startDay].events;

			for (let k = 0; k < eventList.length; k++) {
				if (eventList[k] === undefined || eventList[k] === null) {
					eventIndex = k;
					break;
				}
			}

			if (eventIndex === 0) {
				eventIndex = eventList.length;
			}

			for (let k = startWeek; k <= endWeek; k++) {
				let startOfWeek = true;
				for (
					let l = k === startWeek ? startDay : 0;
					l <= (k === endWeek ? endDay : 6);
					l++
				) {
					calendar[k][l].events[eventIndex] = {
						event: val,
						mergeLeft: !startOfWeek,
						mergeRight: l !== (k === endWeek ? endDay : 6),
						first: startOfWeek
					};
					startOfWeek = false;
				}
			}
		});

		return (
			<div className="calendar">
				<table>
					<caption>
						<Link
							to={`/calendar/${lastMonth.month}/${
								lastMonth.year
							}`}
							className="left-link"
						>
							{MONTHS[lastMonth.month - 1]}
						</Link>
						{MONTHS[month - 1]} {year}
						<Link
							to={`/calendar/${nextMonth.month}/${
								nextMonth.year
							}`}
							className="right-link"
						>
							{MONTHS[nextMonth.month - 1]}
						</Link>
					</caption>
					<tbody>
						<tr>
							<th>Sunday</th>
							<th>Monday</th>
							<th>Tuesday</th>
							<th>Wednesday</th>
							<th>Thursday</th>
							<th>Friday</th>
							<th>Saturday</th>
						</tr>
						{calendar.map((row, k) => (
							<tr key={k}>
								{row.map((item, l) => (
									<td
										key={l}
										className={
											item.month ===
											thisMonth.get('month')
												? 'calendar-inmonth'
												: 'calendar-outmonth'
										}
									>
										<div className="date-name">
											{item.day}
										</div>
										<div className="events-list">
											{item.events.map((val, m) => (
												<Link
													to={
														'/eventviewer/' +
														val.event.id
													}
													key={m}
													className="event-link"
												>
													<div
														className={`event-item ${
															val.mergeLeft
																? 'mergeLeft'
																: ''
														} ${
															val.mergeRight
																? 'mergeRight'
																: ''
														} ${
															val.first
																? 'first-event-name'
																: ''
														}`}
													>
														{val.first
															? val.event.name
															: null}
													</div>
												</Link>
											))}
										</div>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}
}
