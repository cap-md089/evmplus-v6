import Page, { PageProps } from '../../Page';
import { RequiredMember } from './SiteAdmin';
import * as React from 'react';

export const shouldRenderNotifications = (props: PageProps) => {
	return !!props.member;
};

export default class NotificationsPlug extends Page<RequiredMember> {
	public state: {} = {};

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Notifications</div>
				<div className="widget-body">
					<div>
						You have {this.props.fullMemberDetails.notificationCount} unread
						notifications
					</div>
				</div>
			</div>
		);
	}
}
