import { User, hasPermission, hasOneDutyPosition } from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';

export const shouldRenderSiteAdmin = (props: PageProps) => {
	return !!props.member;
};

export interface RequiredMember extends PageProps {
	member: User;
}

export class SiteAdminWidget extends Page<RequiredMember> {
	public state: {} = {};

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">
					{hasPermission('RegistryEdit')()(this.props.member)
						? 'Site '
						: hasPermission('FlightAssign')()(this.props.member) ||
						  ((this.props.member.type === 'CAPNHQMember' ||
								this.props.member.type === 'CAPProspectiveMember') &&
								this.props.member.seniorMember)
						? 'Account '
						: 'Personal '}
					administration
				</div>
				<div className="widget-body">
					<Link to="/admin/attendance">View Attendance</Link>
					<br />
					<Link to="/admin/tempdutypositions">Manage duty positions</Link>
					{hasPermission('FlightAssign')()(this.props.member) ? (
						<>
							<br />
							<Link to="/admin/flightassign">Assign flight members</Link>
						</>
					) : null}
					{hasPermission('RegistryEdit')()(this.props.member) ? (
						<>
							<br />
							<Link to="/admin/regedit">Site configuration</Link>
						</>
					) : null}
					{hasPermission('PermissionManagement')()(this.props.member) ? (
						<>
							<br />
							<Link to="/admin/permissions">Permission management</Link>
						</>
					) : null}
					{(this.props.member.type === 'CAPProspectiveMember' ||
						this.props.member.type === 'CAPNHQMember') &&
					(this.props.member.seniorMember ||
						hasOneDutyPosition(['Cadet Commander', 'Cadet Deputy Commander', 'Cadet Executive Officer'])(
							this.props.member
						)) ? (
						<>
							<br />
							<Link to="/admin/emaillist">Email selector</Link>
						</>
					) : null}
				</div>
			</div>
		);
	}
}
