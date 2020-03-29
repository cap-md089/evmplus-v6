import React from 'react';
import Page, { PageProps } from './Page';
import { isMobile } from '../components/page-elements/SideNavigation';
import DesktopCalendar from './calendars/DesktopCalendar';
import MobileCalendar from './calendars/MobileCalendar';
import './calendars/Calendar.css';
import { EventObject, Timezone } from 'common-lib';
import Loader from '../components/Loader';
import { DateTime, Duration } from 'luxon';
import myFetch from '../lib/myFetch';

export const getMonth = (month: number, year: number) =>
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

const offsets: { [K in Timezone]: number } = {
	'America/Hawaii': 10 * 3600 * 1000,
	'America/Anchorage': 9 * 3600 * 1000,
	'America/Los_Angeles': 8 * 3600 * 1000,
	'America/Arizona': 7 * 3600 * 1000,
	'America/Denver': 7 * 3600 * 1000,
	'America/Chicago': 6 * 3600 * 1000,
	'America/New_York': 5 * 3600 * 1000,
	'America/Puerto_Rico': 4 * 3600 * 1000
};

export const getPositionIndices = (
	date: DateTime,
	calendarStart: DateTime,
	calendarEnd: DateTime,
	month: number,
	year: number
): { weekNumber: number; dayNumber: number } => {
	const daysDifference = date.diff(calendarStart, ['days']).get('days');

	if (+date > +calendarEnd) {
		const thisMonth = getMonth(month, year);
		const numberWeeks = Math.ceil((thisMonth.daysInMonth + (thisMonth.weekday % 7)) / 7) - 1;
		return {
			weekNumber: numberWeeks,
			dayNumber: 6
		};
	}

	if (+date < +calendarStart) {
		return {
			weekNumber: 0,
			dayNumber: 0
		};
	}

	return {
		weekNumber: Math.floor(daysDifference / 7),
		dayNumber: Math.floor(daysDifference % 7)
	};
};

export interface CalendarProps extends PageProps<{ month?: string; year?: string }> {
	events: EventObject[];
	start: DateTime;
	end: DateTime;
}

export default class Calendar extends Page<
	PageProps<{ month?: string; year?: string }>,
	{ events: EventObject[] | null; start: DateTime | null; end: DateTime | null }
> {
	public state: { events: EventObject[] | null; start: DateTime | null; end: DateTime | null } = {
		events: null,
		start: null,
		end: null
	};

	public constructor(props: PageProps<{ month?: string; year?: string }>) {
		super(props);

		this.checkToUpdate = this.checkToUpdate.bind(this);
	}

	public async componentDidMount() {
		window.addEventListener('resize', this.checkToUpdate);

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
		const thisMonthStart = getMonth(month, year);
		const monthEnd = DateTime.fromMillis(+getMonth(month + 1, year) - 1);

		const startOfLastMonthWeek =
			thisMonthStart.weekday === 7 // Sunday
				? thisMonthStart
				: lastMonth.startOf('week').minus(
						Duration.fromObject({
							days: 1
						})
				  );
		const end = monthEnd.endOf('week').day === 5 ? monthEnd : monthEnd.endOf('week');

		const offset = offsets[this.props.registry.Website.Timezone];

		const res = await myFetch(`/api/event/${+startOfLastMonthWeek + offset}/${+end + offset}`, {
			headers: {
				authorization: this.props.member ? this.props.member.sessionID : ''
			}
		});

		const events = (await res.json()) as EventObject[];

		this.setState({
			events,
			start: DateTime.fromMillis(+startOfLastMonthWeek + offset),
			end: DateTime.fromMillis(+end)
		});
	}

	public componentWillUnmount() {
		window.removeEventListener('resize', this.checkToUpdate);
	}

	public render() {
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

	private checkToUpdate() {
		this.forceUpdate();
	}
}
