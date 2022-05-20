/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
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

import {
	effectiveManageEventPermission,
	EventStatus,
	Permissions,
	RawResolvedEventObject,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { MONTHS } from '../../components/form-inputs/DateTimeInput';
import { CalendarProps, getMonth, getPositionIndices } from '../Calendar';
import Page from '../Page';
import './DesktopCalendar.css';

export type CalendarData = Array<
	Array<{
		day: number;
		month: number;
		year: number;
		events: Array<
			| {
					event: RawResolvedEventObject;
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
	index: number,
): boolean => {
	for (let i = startDay; i <= endDay; i++) {
		if (calendar[week][i].events[index] !== undefined) {
			return false;
		}
	}

	return true;
};

const findIndex = (
	calendar: CalendarData,
	startDay: number,
	endDay: number,
	week: number,
): number => {
	let testIndex = 0;

	while (!isIndexFree(calendar, startDay, endDay, week, testIndex)) {
		testIndex++;
	}

	return testIndex;
};

export const getClassNameFromEvent = (obj: RawResolvedEventObject): string => {
	switch (obj.status) {
		case EventStatus.CANCELLED:
			return ' cancelled';

		case EventStatus.DRAFT:
			return obj.teamID !== null && obj.teamID !== undefined ? ' draft team' : ' draft';

		case EventStatus.INFORMATIONONLY:
			return ' info';

		case EventStatus.TENTATIVE:
			return ' tentative';

		case EventStatus.COMPLETE:
		case EventStatus.CONFIRMED:
		default:
			return obj.teamID !== null && obj.teamID !== undefined ? ' team' : '';
	}
};

const getDayString = (inDay: number): string => {
	let day = '';
	switch (inDay) {
		case 0:
			day = 'Sunday';
			break;
		case 1:
			day = 'Monday';
			break;
		case 2:
			day = 'Tuesday';
			break;
		case 3:
			day = 'Wednesday';
			break;
		case 4:
			day = 'Thursday';
			break;
		case 5:
			day = 'Friday';
			break;
		case 6:
			day = 'Saturday';
	}
	return day;
};

export default class DesktopCalendar extends Page<CalendarProps> {
	public state: {} = {};

	public render(): JSX.Element {
		const events = this.props.events;

		// year of calendar display
		const year =
			typeof this.props.routeProps.match.params.year === 'undefined'
				? new Date().getUTCFullYear()
				: parseInt(this.props.routeProps.match.params.year, 10);
		// month of calendar display
		const month =
			typeof this.props.routeProps.match.params.month === 'undefined'
				? new Date().getUTCMonth() + 1
				: parseInt(this.props.routeProps.match.params.month, 10);

		// month previous to display month (minus one millisecond from start of month)
		const lastMonth = DateTime.fromMillis(+getMonth(month, year) - 1);
		// first millisecond of display month
		const thisMonth = getMonth(month, year);
		// first millisecond of month after display month
		const nextMonth = getMonth(month + 1, year);

		const calendar: CalendarData = [];

		// create js Date object with intended month
		const displayDate = new Date(year, month - 1);
		// "day of month" first day
		const dayOfMonthFirst = new Date(displayDate.getTime());
		// "day of month" last day
		const dayOfMonthLast = new Date(year, dayOfMonthFirst.getMonth() + 1, 0, 23, 59);
		// "day of calendar" start day, start with current month
		const dayOfCalendarStart = new Date(year, dayOfMonthFirst.getMonth(), 1);
		// doc start day, modify to be the Sunday before the first day of the display month
		dayOfCalendarStart.setDate(-(dayOfCalendarStart.getDay() - 1));
		// "day of calendar" end day, start with last day of current month
		const dayOfCalendarEnd = new Date(year, dayOfMonthFirst.getMonth() + 1, 0, 23, 59);
		// doc end day, modify to be the Saturday after the last day of the display month
		dayOfCalendarEnd.setDate(dayOfMonthLast.getDate() + (6 - dayOfMonthLast.getDay()));

		// value in milliseconds of one day of time
		const oneHour = 1000 * 60 * 60;
		const oneDay = oneHour * 24;
		// the number of weeks to display the calendar.  Should be 5 the overwhelming majority of the time.
		// will be 4 when February starts on a Sunday.  Will be 6 when long month starts on Friday or Saturday
		const numberWeeks = Math.floor(
			Math.ceil((dayOfCalendarEnd.getTime() - dayOfCalendarStart.getTime()) / oneDay) / 7,
		);

		let i;
		let j;

		for (i = 0; i < numberWeeks; i++) {
			calendar.push([]);
		}

		let calDisp = new Date(dayOfCalendarStart);
		let prevDate = calDisp.getDate();
		for (i = 0; i < numberWeeks; i++) {
			for (j = 0; j < 7; j++) {
				console.log(
					'i, j, calDisp: ' +
						i.toString() +
						', ' +
						j.toString() +
						', ' +
						getDayString(calDisp.getDay()).substr(0, 2) +
						' ' +
						(calDisp.getMonth() + 1).toString() +
						'/' +
						calDisp.getDate().toString() +
						'/' +
						calDisp.getFullYear().toString() +
						' ' +
						calDisp.getHours().toString() +
						':' +
						calDisp.getMinutes().toString() +
						':' +
						calDisp.getSeconds().toString(),
				);
				calendar[i][j] = {
					day: calDisp.getDate(),
					month: calDisp.getMonth(),
					year: calDisp.getFullYear(),
					events: [],
				};
				prevDate = calDisp.getDate();
				calDisp = new Date(calDisp.getTime() + oneDay);
				if (prevDate === calDisp.getDate()) {
					calDisp = new Date(calDisp.getTime() + oneHour);
				}
			}
		}

		// sort events by length to place longer events near the top of the calendar display
		events.sort(
			(b, a) => a.pickupDateTime - a.meetDateTime - (b.pickupDateTime - b.meetDateTime),
		);

		// for each event in the list, determine the display start week and day and
		// the display end week and day, then populate the 2d calendar array with that event
		// in each appropriate day
		events.forEach(val => {
			const startDate = DateTime.fromMillis(val.meetDateTime);
			const endDate = DateTime.fromMillis(val.pickupDateTime);

			// get startWeek and startDay
			// getPositionIndices truncates to 0, 0 as appropriate
			const { weekNumber: startWeek, dayNumber: startDay } = getPositionIndices(
				startDate,
				this.props.start,
				this.props.end,
				month,
				year,
			);
			// get endWeek and endDay
			// getPositionIndices truncates to numberWeeks, 6 as appropriate
			const { weekNumber: endWeek, dayNumber: endDay } = getPositionIndices(
				endDate,
				this.props.start,
				this.props.end,
				month,
				year,
			);

			if (calendar[startWeek] === undefined || calendar[endWeek] === undefined) {
				console.error(
					'Cannot render event!',
					val,
					new Date(val.meetDateTime),
					new Date(val.pickupDateTime),
				);
				return;
			}

			// iterate through each display week, populating calendar array with
			// information for this event
			for (let k = startWeek; k <= endWeek; k++) {
				// if event is contained in a single week
				if (k === startWeek && k === endWeek) {
					const index = findIndex(calendar, startDay % 7, endDay % 7, k);

					calendar[k][startDay % 7].events[index] = {
						block: false,
						event: val,
						width: Math.max(0, (endDay % 7) - (startDay % 7)) + 1,
						mergeLeft: false,
						mergeRight: false,
					};

					for (let l = (startDay % 7) + 1; l <= endDay % 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false,
						};
					}
					// leading partial week of multi-week display
				} else if (k === startWeek) {
					const index = findIndex(calendar, startDay % 7, 6, k);

					calendar[k][startDay % 7].events[index] = {
						block: false,
						event: val,
						width: Math.max(0, 6 - (startDay % 7)) + 1,
						mergeLeft: false,
						mergeRight: true,
					};

					for (let l = (startDay % 7) + 1; l < 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false,
						};
					}
					// trailing partial week of multi-week display
				} else if (k === endWeek) {
					const index = findIndex(calendar, 0, endDay % 7, k);

					calendar[k][0].events[index] = {
						block: false,
						event: val,
						width: Math.max(0, endDay % 7) + 1,
						mergeLeft: true,
						mergeRight: false,
					};

					for (let l = 1; l < endDay % 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false,
						};
					}
					// inclusive full weeks
				} else {
					const index = findIndex(calendar, 0, 6, k);

					calendar[k][0].events[index] = {
						block: false,
						event: val,
						width: 7,
						mergeLeft: true,
						mergeRight: true,
					};

					for (let l = 1; l < 7; l++) {
						calendar[k][l].events[index] = {
							block: true,
							event: val,
							width: 0,
							mergeLeft: false,
							mergeRight: false,
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
			<div className="calendar calendar-desktop">
				{this.props.member &&
				effectiveManageEventPermission(this.props.member) !==
					Permissions.ManageEvent.NONE ? (
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
											item.month === thisMonth.get('month') - 1
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
															width: `${val.width * 100}%`,
														}}
													>
														<Link
															to={`/eventviewer/${
																val.event.id
															}-${val.event.name
																.toLocaleLowerCase()
																.replace(/ /g, '-')}`}
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
																	val.event,
																)}`}
																title={val.event.name}
															>
																{val.event.name}
															</div>
														</Link>
													</div>
												),
											)}
										</div>
									</td>
								))}
							</tr>
						))}
					</tbody>
					<td id="legend" colSpan={7}>
						<div className="calendar-outmonth">
							<div className="date-name">Legend</div>
							<div className="events-list">
								<table className="event-container" style={{ width: '100%' }}>
									<tbody>
										<tr>
											<td>
												<li className="event-item">Event</li>
											</td>
											<td>
												<li className="event-item draft">Draft</li>
											</td>
											<td>
												<li className="event-item team">Team</li>
											</td>
											<td>
												<li className="event-item draft team">
													Team draft
												</li>
											</td>
											<td>
												<li className="event-item tentative">Tentative</li>
											</td>
											<td>
												<li className="event-item cancelled">Cancelled</li>
											</td>
											<td>
												<li className="event-item info">Info</li>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</td>
				</table>
			</div>
		);
	}
}
