/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Either, RawEventObject, RawResolvedEventObject } from 'common-lib';
import { DateTime } from 'luxon';
import React from 'react';
import Loader from '../components/Loader';
import { isMobile } from '../components/page-elements/SideNavigation';
import fetchApi from '../lib/apis';
import './calendars/Calendar.css';
import DesktopCalendar from './calendars/DesktopCalendar';
import MobileCalendar from './calendars/MobileCalendar';
import Page, { PageProps } from './Page';

export const getMonth = (month: number, year: number): DateTime =>
	DateTime.utc()
		.set({
			year,
			month,
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
	'December',
];

export const getPositionIndices = (
	date: DateTime,
	calendarStart: DateTime,
	calendarEnd: DateTime,
	month: number,
	year: number,
): { weekNumber: number; dayNumber: number } => {
	const daysDifference = date.diff(calendarStart, ['days']).get('days');

	if (+date > +calendarEnd) {
		const thisMonth = getMonth(month, year);
		const numberWeeks = Math.ceil((thisMonth.daysInMonth + (thisMonth.weekday % 7)) / 7) - 1;
		return {
			weekNumber: numberWeeks,
			dayNumber: 6,
		};
	}

	if (+date < +calendarStart) {
		return {
			weekNumber: 0,
			dayNumber: 0,
		};
	}

	return {
		weekNumber: Math.floor(daysDifference / 7),
		dayNumber: Math.floor(daysDifference % 7),
	};
};

export interface CalendarProps extends PageProps<{ month?: string; year?: string }> {
	events: RawResolvedEventObject[];
	start: DateTime;
	end: DateTime;
}

export default class Calendar extends Page<
	PageProps<{ month?: string; year?: string }>,
	{ events: RawEventObject[] | null; start: DateTime | null; end: DateTime | null }
> {
	public state: {
		events: RawResolvedEventObject[] | null;
		start: DateTime | null;
		end: DateTime | null;
	} = {
		events: null,
		start: null,
		end: null,
	};

	public constructor(props: PageProps<{ month?: string; year?: string }>) {
		super(props);

		this.checkToUpdate = this.checkToUpdate.bind(this);
	}

	public async componentDidMount(): Promise<void> {
		window.addEventListener('resize', this.checkToUpdate);

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/calendar',
				text: 'Calendar',
			},
		]);

		this.props.deleteReduxState();
		
		this.updateTitle('Calendar');

		this.props.updateSideNav([]);

		const year =
			typeof this.props.routeProps.match.params.year === 'undefined'
				? new Date().getFullYear()
				: parseInt(this.props.routeProps.match.params.year, 10);
		const month =
			typeof this.props.routeProps.match.params.month === 'undefined'
				? new Date().getMonth() + 1
				: parseInt(this.props.routeProps.match.params.month, 10);

		// "day of month" first day
		const dayOfMonthFirst = new Date(`${month}/1/${year}`);
		// const dayOfMonthLast = new Date(year, dayOfMonthFirst.getMonth() + 1, 0, 23, 59);
		// "day of calendar" start day, start with current month
		let dayOfCalendarStart = dayOfMonthFirst;
		// determine day of week
		let dayOfWeekMonth = dayOfCalendarStart.getDay();
		while (dayOfWeekMonth > 0) {
			dayOfCalendarStart = new Date(+dayOfCalendarStart - 24 * 60 * 60 * 1000);
			dayOfWeekMonth = dayOfCalendarStart.getDay();
		}

		// js Date copy to ensure that follow-on statement does not corrupt thisMonth
		const monthBuffer = new Date(dayOfMonthFirst);
		// js Date first day of next month
		const nextMonth = new Date(monthBuffer.setMonth(monthBuffer.getMonth() + 1));
		// "day of month" last day
		const dayOfMonthLast = new Date(+nextMonth - 1);

		let dayOfCalendarEnd = dayOfMonthLast;
		dayOfWeekMonth = dayOfCalendarEnd.getDay();
		while (dayOfWeekMonth < 6) {
			dayOfCalendarEnd = new Date(+dayOfCalendarEnd + 24 * 60 * 60 * 1000);
			dayOfWeekMonth = dayOfCalendarEnd.getDay();
		}

		const resEither = await fetchApi.events.events.getRange(
			{
				timestart: dayOfCalendarStart.getTime().toString(),
				timeend: dayOfCalendarEnd.getTime().toString(),
			},
			{},
		);

		if (Either.isLeft(resEither)) {
			return;
		}

		const events = resEither.value;

		this.setState({
			events,
			start: DateTime.fromMillis(dayOfCalendarStart.getTime()),
			end: DateTime.fromMillis(dayOfCalendarEnd.getTime()),
		});
	}

	public componentWillUnmount(): void {
		window.removeEventListener('resize', this.checkToUpdate);
	}

	public render(): JSX.Element {
		if (this.state.events === null || this.state.start === null || this.state.end === null) {
			return <Loader />;
		}

		return isMobile() ? (
			<MobileCalendar
				{...this.props}
				events={this.state.events}
				start={this.state.start}
				end={this.state.end}
			/>
		) : (
			<DesktopCalendar
				{...this.props}
				events={this.state.events}
				start={this.state.start}
				end={this.state.end}
			/>
		);
	}

	private checkToUpdate = (): void => {
		this.forceUpdate();
	};
}
