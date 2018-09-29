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
		if (this.state.events === null) {
			return <Loader />;
		} else {
			return this.renderCalendar(this.state.events!);
		}
	}

	public componentDidMount() {
		myFetch('/api/event')
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

		const lastMonth = getMonth(month - 1, year).endOf('month');
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
			}>
		> = [];

		const startOfLastMonthWeek = lastMonth.startOf('week');
		let j;
		let i;

		calendar[0] = [];
		for (i = 0; i < firstDay; i++) {
			calendar[0][i] = {
				day: startOfLastMonthWeek.day + i - 1,
				month: lastMonth.month,
				year: lastMonth.year
			};
		}

		for (i = firstDay; i < 7; i++) {
			calendar[0][i] = {
				day: i - firstDay + 1,
				month: thisMonth.month,
				year: thisMonth.year
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
		for (i = start, j = 0; i <= thisMonth.daysInMonth; i++, j++) {
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
						{calendar.map(row => (
							<tr>
								{row.map(item => (
									<td
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
										<div className="events-list" />
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
