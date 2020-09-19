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
import './MobileCalendar.scss';

export default class MobileCalendar extends Page<CalendarProps> {
	public state = {
		events: null,
	};

	public render() {
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

		const days = Array(thisMonth.daysInMonth);
		for (let i = 0; i < days.length; i++) {
			days[i] = [];
		}

		events.forEach(event => {
			const startDate = DateTime.fromMillis(event.meetDateTime);
			const endDate = DateTime.fromMillis(event.pickupDateTime);

			const startDay = +startDate < +thisMonth ? 0 : startDate.day - 1;
			const endDay =
				+endDate < +thisMonth ? 0 : +endDate >= +nextMonth ? thisMonth.day : endDate.day;

			for (let i = startDay; i < endDay; i++) {
				days[i].push(event);
			}
		});

		return (
			<div className="calendar calendar-mobile">
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
					{('0' + (index + 1)).substr(-2)}. {month.set({ day: index + 1 }).weekdayLong}
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
