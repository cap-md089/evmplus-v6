/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	RawEventObject,
	EventStatus,
	effectiveManageEventPermission,
	Permissions
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { CalendarProps, getMonth, getPositionIndices } from '../Calendar';
import Page from '../Page';
import './DesktopCalendar.css';
import { MONTHS } from '../../components/form-inputs/DateTimeInput';

export type CalendarData = Array<
	Array<{
		day: number;
		month: number;
		year: number;
		events: Array<
			| {
					event: RawEventObject;
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

export const getClassNameFromEvent = (obj: RawEventObject) => {
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

export default class DesktopCalendar extends Page<CalendarProps> {
	public state: {} = {};

	public render() {
		let events = this.props.events;

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

		const isWeekWeird = lastMonth.startOf('week').day === lastMonth.day - 6;

		const startOfLastMonthWeek = isWeekWeird ? lastMonth : lastMonth.startOf('week');

		let i;
		let j;

		calendar[0] = [];
		for (i = 0; i < firstDay; i++) {
			calendar[0][i] = {
				day: startOfLastMonthWeek.day + i - (isWeekWeird ? 0 : 1),
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

			const { weekNumber: startWeek, dayNumber: startDay } = getPositionIndices(
				startDate,
				this.props.start,
				this.props.end,
				month,
				year
			);
			const { weekNumber: endWeek, dayNumber: endDay } = getPositionIndices(
				endDate,
				this.props.start,
				this.props.end,
				month,
				year
			);

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
			<div className="calendar-desktop">
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
															width: `${val.width * 100}%`
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
