import * as React from 'react';
import Page, { PageProps } from '../../Page';

interface NotificationsState {
	notifications: Array<{}> | null;
}

export default class Notifications extends Page<PageProps, NotificationsState> {
	public state: NotificationsState = {
		notifications: []
	};

	public render() {
		return <div />;
	}
}