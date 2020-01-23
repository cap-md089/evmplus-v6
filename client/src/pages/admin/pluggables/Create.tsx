import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';
import MemberBase, { CAPNHQMember } from '../../../lib/Members';

export const canUseCreate = (props: PageProps) => {
	if (!props.member) {
		return false;
	}

	return props.member.hasPermission('ManageEvent') || props.member.hasPermission('ManageTeam');
};

interface CreateWidgetProps extends PageProps {
	member: MemberBase;
}

export class CreateWidget extends Page<CreateWidgetProps> {
	public state: {} = {};
	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Create something</div>
				<div className="widget-body">
					{this.props.member.hasPermission('ManageEvent') ||
					(this.props.member instanceof CAPNHQMember &&
						this.props.member.hasDutyPosition([
							'Operations Officer',
							'Cadet Operations Officer',
							'Cadet Operations NCO'
						])) ? (
						<>
							<Link to="/addevent">Draft an event</Link>
							<br />
						</>
					) : null}
					{this.props.member.hasPermission('ManageTeam') ? (
						<>
							<Link to="/team/create">Add a team</Link>
							<br />
						</>
					) : null}
				</div>
			</div>
		);
	}
}
