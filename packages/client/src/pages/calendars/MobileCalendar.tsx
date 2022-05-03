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

import { effectiveManageEventPermission, Permissions, RawResolvedEventObject } from 'common-lib';
import { DateTime } from 'luxon';
import React from 'react';
import { Link } from 'react-router-dom';
import { MONTHS } from '../../components/form-inputs/DateTimeInput';
import { CalendarProps, getMonth } from '../Calendar';
import Page from '../Page';
import { getClassNameFromEvent } from './DesktopCalendar';
import './MobileCalendar.css';

export default class MobileCalendar extends Page<CalendarProps> {
	public state = {
		events: null,
	};

	public render(): JSX.Element {
		const events = this.props.events;

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

		const days = Array(thisMonth.daysInMonth) as RawResolvedEventObject[][];
		for (let i = 0; i < days.length; i++) {
			days[i] = [];
		}

		events.forEach(event => {
			// only display events which have days within this calendar month
			if (event.meetDateTime > +nextMonth || event.pickupDateTime < +thisMonth) {
				return;
			}
			// get Date object of first day of event
			const eventStart = new Date(event.meetDateTime);
			// first display day is later of event start day or first day of display month
			const startDate =
				eventStart.getMonth() === new Date(year, month - 1).getMonth()
					? eventStart.getDate()
					: 1;
			// get Date object of last day of event
			const eventEnd = new Date(event.pickupDateTime);
			// last display day is earlier of event end day or last day of display month
			const endDate =
				eventEnd.getMonth() === new Date(year, month - 1).getMonth()
					? eventEnd.getDate()
					: thisMonth.daysInMonth;

			// load zero-based array of display days
			for (let i = startDate - 1; i < endDate; i++) {
				days[i]?.push?.(event);
			}
		});

		return (
			<div className="calendar calendar-mobile">
				<div id="legend">
					<ul class="day-list">
						<li>
							<div class="events-list">
								<div class="date-name">Legend</div>
								<div class="events-list">
									<table class="event-container" style="width: 100%;">
										<tbody>
											<tr>
												<td>
													<li class="event-item">Event</li>
												</td>
												<td>
												date-name	<li class="event-item draft">Draft</li>
												</td>
												<td>
													<li class="event-item team">Team</li>
												</td>
												<td>
													<li class="event-item draft team">Team draft</li>
												</td>
												<td>
													<li class="event-item tentative">Tentative</li>
												</td>
												<td>
													<li class="event-item cancelled">Cancelled</li>
												</td>
												<td>
													<li class="event-item info">Info</li>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</li>
					</ul>
				</div>
				{this.props.member &&
				effectiveManageEventPermission(this.props.member) !==
					Permissions.ManageEvent.NONE ? (
					<Link to="/eventform">Add event</Link>
				) : null}
				<div className="calendar-title">
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
				</div>
				<ul className="day-list">
					{days
						.map(this.renderEventListForDay(thisMonth))
						.filter(eventList => !!eventList)}
				</ul>
			</div>
		);
	}

	private renderEventListForDay = (month: DateTime) => (
		events: RawResolvedEventObject[],
		index: number,
	) => {
		if (events.length === 0) {
			return null;
		}

		return (
			<li key={index}>
				<div className="day-title">
					{`0${index + 1}`.substr(-2)}. {month.set({ day: index + 1 }).weekdayLong}
				</div>
				<ul className="events-list">
					{events.map((event, i) => (
						<Link
							to={`/eventviewer/${event.id}-${event.name
								.toLocaleLowerCase()
								.replace(/ /g, '-')}`}
							key={i}
						>
							<li className={`event-item${getClassNameFromEvent(event)}`}>
								{event.name}
							</li>
						</Link>
					))}
				</ul>
			</li>
		);
	};
}
