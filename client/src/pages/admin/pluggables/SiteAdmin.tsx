import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';
import MemberBase, { CAPNHQMember } from '../../../lib/Members';

export const shouldRenderSiteAdmin = (props: PageProps) => {
	return true;
};

export interface RequiredMember extends PageProps {
	member: MemberBase;
}

export class SiteAdminWidget extends Page<RequiredMember> {
	public state: {} = {};

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">
					{this.props.member.hasPermission('RegistryEdit')
						? 'Site '
						: this.props.member.hasPermission('FlightAssign') ||
						  (this.props.member instanceof CAPNHQMember &&
								this.props.member.seniorMember)
						? 'Account '
						: 'Personal '}
					administration
				</div>
				<div className="widget-body">
					<Link to="/admin/tempdutypositions">Manage duty positions</Link>
					{this.props.member.hasPermission('FlightAssign') ? (
						<>
							<br />
							<Link to="/admin/flightassign">Assign flight members</Link>
						</>
					) : null}
					{this.props.member.hasPermission('RegistryEdit') ? (
						<>
							<br />
							<Link to="/admin/regedit">Site configuration</Link>
						</>
					) : null}
					{this.props.member.hasPermission('PermissionManagement') ? (
						<>
							<br />
							<Link to="/admin/permissions">Permission management</Link>
						</>
					) : null}
					{this.props.member instanceof CAPNHQMember && this.props.member.seniorMember ? (
						<>
							<br />
							<Link to="/emailselector">Email selector</Link>
						</>
					) : null}
				</div>
			</div>
		);
	}
}
