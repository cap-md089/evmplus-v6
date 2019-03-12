import { NotificationObject } from 'common-lib';
import * as React from 'react';
import Loader from '../../../components/Loader';
import Page, { PageProps } from '../../Page';

interface NotificationsState {
	notifications: Array<NotificationObject> | null;
}

export default class Notifications extends Page<PageProps, NotificationsState> {
	public state: NotificationsState = {
		notifications: null
	};

	public async componentDidMount() {
	}

	public render() {
		if (this.state.notifications === null) {
			return <Loader />;
		}

		return (
			<div>Asdf</div>
		);
	}
}
