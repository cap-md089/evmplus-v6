import * as React from 'react';
import Page, { PageProps } from 'src/pages/Page';
import { Link } from 'react-router-dom';
import MemberBase from 'src/lib/Members';

export const canUseCreate = (props: PageProps) => {
	if (!props.member) {
		return false;
	}

	return (
		props.member.hasPermission('AddEvent') ||
		props.member.canManageBlog() ||
		props.member.hasPermission('AddTeam')
	);
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
					{this.props.member.hasPermission('AddEvent') ? (
						<>
							<Link to="/addevent">Draft an event</Link>
							<br />
						</>
					) : null}
					{this.props.member.canManageBlog() ? (
						<>
							<Link to="/news/post">Create a blog post</Link>
							<br />
							<Link to="/page/create">Or create a page</Link>
							<br />
							<Link to="/page/list">View current pages</Link>
							<br />
						</>
					) : null}
					{this.props.member.hasPermission('AddTeam') ? (
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
