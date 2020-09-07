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

import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';
import { RequiredMember } from './SiteAdmin';
import { MemberCreateError } from 'common-lib';

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
						You have{' '}
						{this.props.fullMemberDetails.error === MemberCreateError.NONE
							? this.props.fullMemberDetails.notificationCount
							: 0}{' '}
						unread notifications
						<br />
						<br />
						<Link to="/admin/notifications">View all</Link>
					</div>
				</div>
			</div>
		);
	}
}
