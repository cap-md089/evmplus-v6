import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';
import {
	effectiveManageEventPermission,
	Permissions,
	hasPermission,
	User,
	AccountType
} from 'common-lib';

export const canUseCreate = (props: PageProps) => {
	if (!props.member) {
		return false;
	}

	return (
		effectiveManageEventPermission(props.member) !== Permissions.ManageEvent.NONE ||
		hasPermission('ManageTeam')()(props.member) ||
		hasPermission('ProspectiveMemberManagement')()(props.member)
	);
};

interface CreateWidgetProps extends PageProps {
	member: User;
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
					{hasPermission('ManageTeam')()(this.props.member) ? (
						<>
							<Link to="/team/create">Add a team</Link>
							<br />
						</>
					) : null}
					{hasPermission('ProspectiveMemberManagement')()(this.props.member) &&
					this.props.account.type !== AccountType.CAPEVENT ? (
						<>
							<Link to="/admin/createcapprospectiveaccount">
								Create a prospective member account
							</Link>
							<br />
						</>
					) : null}
				</div>
			</div>
		);
	}
}
