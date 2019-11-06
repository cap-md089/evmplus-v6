import { EventObject, EventStatus } from 'common-lib';
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

type CalendarData = Array<
	Array<{
		day: number;
		month: number;
		year: number;
		events: Array<
			| {
					event: EventObject;
					width: number;
					block: boolean;
					mergeLeft: boolean;
					mergeRight: boolean;
			  }
			| undefined
		>;
	}>
>;

const isIndexFree = (
	calendar: CalendarData,
	startDay: number,
	endDay: number,
	week: number,
	index: number
) => {
	for (let i = startDay; i <= endDay; i++) {
		if (calendar[week][i].events[index] !== undefined) {
			return false;
		}
	}

	return true;
};

const findIndex = (calendar: CalendarData, startDay: number, endDay: number, week: number) => {
	let testIndex = 0;

	while (!isIndexFree(calendar, startDay, endDay, week, testIndex)) {
		testIndex++;
	}

	return testIndex;
};

const getClassNameFromEvent = (obj: EventObject) => {
	switch (obj.status) {
		case EventStatus.CANCELLED:
			return ' cancelled';

		case EventStatus.DRAFT:
			return obj.teamID !== null ? ' draft team' : ' draft';

		case EventStatus.INFORMATIONONLY:
			return ' info';

		case EventStatus.TENTATIVE:
			return ' tentative';

		case EventStatus.COMPLETE:
		case EventStatus.CONFIRMED:
		default:
			return obj.teamID !== null ? ' team' : '';
	}
};

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
		return this.state.events === null ? <Loader /> : this.renderCalendar(this.state.events!);
	}

	public async componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/calendar',
				text: 'Calendar'
			}
		]);

		this.updateTitle('Calendar');

		this.props.updateSideNav([]);

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

		const res = await myFetch(`/api/event/${+startOfLastMonthWeek}/${+endOfNextMonth}`, {
			headers: {
				authorization: this.props.member ? this.props.member.sessionID : ''
			}
		});

		const events = (await res.json()) as EventObject[];

		this.setState({
			events
		});
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

		const numberWeeks = Math.ceil((thisMonth.daysInMonth + (thisMonth.weekday % 7)) / 7) + 1;

		const calendar: CalendarData = [];

		const weird = lastMonth.startOf('week').day === lastMonth.day - 6;

		const startOfLastMonthWeek = weird ? lastMonth : lastMonth.startOf('week');

		let i;
		let j;

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
			(a, b) => b.endDateTime - b.pickupDateTime - (a.endDateTime - a.pickupDateTime)
		);

		events = events.reverse();

		events.forEach(val => {
			const startDate = DateTime.fromMillis(val.meetDateTime);
			const endDate = DateTime.fromMillis(val.pickupDateTime);

			let startWeek = 0;
			let startDay = 0;

			let endWeek = 0;
			let endDay = 0;

			if (startDate < thisMonth) {
				startWeek = 0;
				startDay =
					+startDate + (thisMonth.weekday % 7) * 24 * 3600 * 1000 < +thisMonth
						? 0
						: startDate.weekday;
			} else if (startDate < nextMonth) {
				startWeek = Math.floor(((thisMonth.weekday % 7) + startDate.day) / 7);
				startDay = startDate.weekday;
			} else {
				startWeek = calendar.length - 1;
				startDay = startDate.weekday;
			}

			if (endDate > nextMonth) {
				const nextWeek = +nextMonth + (nextMonth.weekday % 7) * 24 * 3600 * 1000;
				endWeek = calendar.length - 1;
				endDay = +endDate > nextWeek ? 7 : endDate.weekday;
			} else if (endDate > thisMonth) {
				endWeek = Math.floor(((thisMonth.weekday % 7) + endDate.day) / 7);
				endDay = endDate.weekday;
			} else {
				endWeek = 0;
				endDay = endDate.weekday;
			}

			for (let k = startWeek; k <= endWeek; k++) {
				if (k === startWeek && k === endWeek) {
					const index = findIndex(calendar, startDay % 7, endDay % 7, k);

					calendar[k][startDay % 7].events[index] = {
						block: false,
						event: val,
						width: Math.max(0, (endDay % 7) - (startDay % 7)) + 1,
						mergeLeft: false,
						mergeRight: false
					};

					for (let l = (startDay % 7) + 1; l <= endDay % 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false
						};
					}
				} else if (k === startWeek) {
					const index = findIndex(calendar, startDay % 7, 6, k);

					calendar[k][startDay % 7].events[index] = {
						block: false,
						event: val,
						width: Math.max(0, 6 - (startDay % 7)) + 1,
						mergeLeft: false,
						mergeRight: true
					};

					for (let l = (startDay % 7) + 1; l < 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false
						};
					}
				} else if (k === endWeek) {
					const index = findIndex(calendar, 0, endDay % 7, k);

					calendar[k][0].events[index] = {
						block: false,
						event: val,
						width: Math.max(0, endDay % 7) + 1,
						mergeLeft: true,
						mergeRight: false
					};

					for (let l = 1; l < endDay % 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false
						};
					}
				} else {
					const index = findIndex(calendar, 0, 6, k);

					calendar[k][0].events[index] = {
						block: false,
						event: val,
						width: 7,
						mergeLeft: true,
						mergeRight: true
					};

					for (let l = 1; l < 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false
						};
					}
				}
			}
		});

		for (const k of calendar) {
			for (const l of k) {
				for (let m = 0; m < l.events.length; m++) {
					l.events[m] = l.events[m] === undefined ? undefined : l.events[m];
				}
			}
		}

		return (
			<div className="calendar">
				{this.props.member && this.props.member.hasPermission('ManageEvent') ? (
					<Link to="/eventform">Add event</Link>
				) : null}
				<table>
					<caption>
						<Link
							to={`/calendar/${lastMonth.month}/${lastMonth.year}`}
							className="left-link"
						>
							{MONTHS[lastMonth.month - 1]}
						</Link>
						{MONTHS[month - 1]} {year}
						<Link
							to={`/calendar/${nextMonth.month}/${nextMonth.year}`}
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
											item.month === thisMonth.get('month')
												? 'calendar-inmonth'
												: 'calendar-outmonth'
										}
									>
										<div className="date-name">{item.day}</div>
										<div className="events-list">
											{item.events.map((val, m) =>
												val === undefined || val.block === true ? (
													<div className="block" />
												) : (
													<div
														className="event-container"
														style={{
															width: `calc(${val.width * 100}% + ${
																val.width
															}px)`
														}}
													>
														<Link
															to={'/eventviewer/' + val.event.id}
															key={m}
															className="event-link"
														>
															<div
																className={`event-item${
																	val.mergeLeft
																		? ' mergeLeft'
																		: ''
																}${
																	val.mergeRight
																		? ' mergeRight'
																		: ''
																}${getClassNameFromEvent(
																	val.event
																)}`}
															>
																{val.event.name}
															</div>
														</Link>
													</div>
												)
											)}
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
