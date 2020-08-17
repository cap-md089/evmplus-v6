/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { CAPMemberReference, Either } from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import LoaderShort from '../../../components/LoaderShort';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

interface ProspectiveMemberManagementLoadingState {
	state: 'LOADING';
}

interface ProspectiveMemberManagementLoadedState {
	state: 'LOADED';

	members: CAPMemberReference[];
}

interface ProspectiveMemberManagementErrorState {
	state: 'ERROR';

	message: string;
}

type ProspectiveMemberManagementState =
	| ProspectiveMemberManagementErrorState
	| ProspectiveMemberManagementLoadedState
	| ProspectiveMemberManagementLoadingState;

export class ProspectiveMemberManagementWidget extends Page<
	PageProps,
	ProspectiveMemberManagementState
> {
	public state: ProspectiveMemberManagementState = {
		state: 'LOADING',
	};

	public async componentDidMount() {
		if (this.props.member) {
			const memberEither = await fetchApi.member.memberList(
				{ type: 'CAPProspectiveMember' },
				{},
				this.props.member.sessionID,
			);

			if (Either.isLeft(memberEither)) {
				this.setState({
					state: 'ERROR',
					message: memberEither.value.message,
				});
			} else {
				this.setState({
					state: 'LOADED',
					members: memberEither.value,
				});
			}
		}
	}

	public render() {
		return (
			<div className="widget">
				<Link to="/admin/prospectivemembermanagement">
					<div className="widget-title">Prospective Member Management</div>
				</Link>
				<div className="widget-body">
					{this.state.state === 'LOADING' ? (
						<LoaderShort />
					) : this.state.state === 'ERROR' ? (
						<div>{this.state.message}</div>
					) : (
						<div>
							<Link to="/admin/createcapprospectiveaccount">
								Create a prospective member account
							</Link>
							<br />
							<br />
							{this.state.members.length > 0 ? (
								<Link to="/admin/prospectivemembermanagement">
									Manage {this.state.members.length} prospective member account
									{this.state.members.length === 1 ? '' : 's'}
								</Link>
							) : null}
						</div>
					)}
				</div>
			</div>
		);
	}
}
