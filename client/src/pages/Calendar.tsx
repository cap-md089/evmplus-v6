import React from 'react';
import Page, { PageProps } from './Page';
import { isMobile } from '../components/page-elements/SideNavigation';
import DesktopCalendar from './calendars/DesktopCalendar';
import MobileCalendar from './calendars/MobileCalendar';
import './calendars/Calendar.css';

export default class Calendar extends Page<PageProps<{ month?: string; year?: string }>> {
	public state: {} = {};

	public constructor(props: PageProps<{ month?: string; year?: string }>) {
		super(props);

		this.checkToUpdate = this.checkToUpdate.bind(this);
	}

	public componentDidMount() {
		window.addEventListener('resize', this.checkToUpdate);
	}

	public componentWillUnmount() {
		window.removeEventListener('resize', this.checkToUpdate);
	}

	public render() {
		return isMobile() ? (
			<MobileCalendar {...this.props} />
		) : (
			<DesktopCalendar {...this.props} />
		);
	}

	private checkToUpdate() {
		this.forceUpdate();
	}
}
