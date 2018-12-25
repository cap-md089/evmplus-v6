import * as $ from 'jquery';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { MemberCreateError } from '../enums';
import SigninLink from './SigninLink';

class SideNavigationLink extends React.Component<{ target: string }> {
	public render() {
		return (
			<Link to={this.props.target}>
				<span className="arrow" />
				<span>{this.props.children}</span>
			</Link>
		);
	}
}
class SideNavigationReferenceLink extends React.Component<{
	target: string;
}> {
	public render() {
		return (
			<a
				href={`#${this.props.target}`}
				onClick={(e: React.MouseEvent<HTMLElement>) => {
					e.preventDefault();
					const offset = $(e.target).offset();
					if (offset) {
						$('html').animate(
							{
								scrollTop: offset.top
							},
							2000
						);
					}
				}}
			>
				<span className="arrow" />
				<span>{this.props.children}</span>
			</a>
		);
	}
}

export type SideNavigationItem =
	| { type: 'Reference'; target: string; text: React.ReactChild }
	| { type: 'Link'; target: string; text: React.ReactChild };

export interface SideNavigationProps {
	links: SideNavigationItem[];
	member: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
}

export class SideNavigation extends React.Component<SideNavigationProps> {
	constructor(props: SideNavigationProps) {
		super(props);

		this.signOut = this.signOut.bind(this);
	}

	public render() {
		let memberRank = '';
		let memberName = '';
		if (this.props.member.valid) {
			if (
				this.props.member.member.type === 'CAPNHQMember' ||
				this.props.member.member.type === 'CAPProspectiveMember'
			) {
				memberRank = this.props.member.member.memberRank;
			}
			const {
				nameFirst,
				nameLast,
				nameMiddle,
				nameSuffix
			} = this.props.member.member;
			memberName = [nameFirst, nameMiddle, nameLast, nameSuffix]
				.filter(i => i !== '')
				.join(' ');
		}
		return (
			<div id="sidenav">
				<ul id="nav">
					<li>
						{this.props.member.valid ? (
							<a onClick={this.signOut}>
								<span className="arrow" />
								<span>
									Sign out {`${memberRank} ${memberName}`}
								</span>
							</a>
						) : (
							<SigninLink
								{...this.props.member}
								authorizeUser={this.props.authorizeUser}
							>
								<span className="arrow" />
								<span>Sign in</span>
							</SigninLink>
						)}
					</li>
					{this.props.links.map((link, i) => (
						<li key={i}>
							{link.type === 'Link' ? (
								<SideNavigationLink target={link.target}>
									{link.text}
								</SideNavigationLink>
							) : (
								<SideNavigationReferenceLink
									target={link.target}
								>
									{link.text}
								</SideNavigationReferenceLink>
							)}
						</li>
					))}
				</ul>
			</div>
		);
	}

	private signOut() {
		this.props.authorizeUser({
			valid: false,
			error: MemberCreateError.NONE,
			member: null,
			sessionID: ''
		});
		localStorage.removeItem('sessionID');
	}
}

export default SideNavigation;
