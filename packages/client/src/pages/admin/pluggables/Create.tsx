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

import {
	canCreateCAPEventAccount,
	effectiveManageEventPermission,
	hasPermission,
	Permissions,
	ClientUser,
} from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';

export const canUseCreate = (props: PageProps) => {
	if (!props.member) {
		return false;
	}

	return (
		effectiveManageEventPermission(props.member) !== Permissions.ManageEvent.NONE ||
		hasPermission('ManageTeam')(Permissions.ManageTeam.FULL)(props.member) ||
		hasPermission('ProspectiveMemberManagement')(Permissions.ProspectiveMemberManagement.FULL)(
			props.member,
		)
	);
};

interface CreateWidgetProps extends PageProps {
	member: ClientUser;
}

export class CreateWidget extends Page<CreateWidgetProps> {
	public state: {} = {};
	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Create something</div>
				<div className="widget-body">
					{effectiveManageEventPermission(this.props.member) !==
					Permissions.ManageEvent.NONE ? (
						<>
							<Link to="/addevent">Draft an event</Link>
							<br />
						</>
					) : null}
					{hasPermission('ManageTeam')(Permissions.ManageTeam.FULL)(this.props.member) ? (
						<>
							<Link to="/team/create">Add a team</Link>
							<br />
						</>
					) : null}
					{canCreateCAPEventAccount(this.props.account)(this.props.member) ? (
						<>
							<Link to="/admin/createeventaccount">Create a special event</Link>
						</>
					) : null}
				</div>
			</div>
		);
	}
}
