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
