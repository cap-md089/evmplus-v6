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

import { getFullMemberName, MemberCreateError, SigninReturn, ClientUser } from 'common-lib';
import $ from 'jquery';
import * as React from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import fetchApi from '../../lib/apis';
import SigninLink from '../SigninLink';
import './SideNavigation.css';

export const isMobile = (): boolean => window.innerWidth < 1028;

interface LinkInformation {
	target: string;
	onClick: () => void;
}

const SideNavigationLink: React.FC<LinkInformation> = ({ target, onClick, children }) => (
	<Link to={target} onClick={onClick}>
		<span className="arrow" />
		<span>{children}</span>
	</Link>
);

const SideNavigationReferenceLink: React.FC<LinkInformation> = ({ target, onClick, children }) => (
	<a href={`#${target}`} onClick={onClick}>
		<span className="arrow" />
		<span>{children}</span>
	</a>
);

export type SideNavigationItem =
	| { type: 'Reference'; target: string; text: React.ReactChild }
	| { type: 'Link'; target: string; text: React.ReactChild };

export interface SideNavigationProps extends RouteComponentProps<{}> {
	links: SideNavigationItem[];
	member: ClientUser | null;
	fullMemberDetails: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
}

const cursor: React.CSSProperties = {
	cursor: 'pointer',
};

interface SideNavigationState {
	open: boolean;
	stuck: boolean;
}

const sidenavOffset = 136 + 45;

export class SideNavigation extends React.Component<SideNavigationProps, SideNavigationState> {
	public state: SideNavigationState = {
		open: false,
		stuck: false,
	};

	private menuRef = React.createRef<HTMLDivElement>();

	public componentDidMount(): void {
		window.addEventListener('scroll', this.handleScroll);
		window.addEventListener('resize', () => this.forceUpdate());
	}

	public componentWillUnmount(): void {
		window.removeEventListener('scroll', this.handleScroll);
		window.removeEventListener('resize', () => this.forceUpdate());
	}

	public render = (): JSX.Element => (
		<nav
			className={`side-nav ${this.state.open ? 'parent-open' : 'parent-closed'} ${
				this.state.stuck ? 'stuck' : 'unstuck'
			}`}
			ref={this.menuRef}
		>
			{isMobile() ? (
				<div className="nav-item mobile-opener">
					<button onClick={this.toggleOpen} style={cursor}>
						<span className="arrow" />
						<span>Menu</span>
					</button>
				</div>
			) : null}
			<ul id="nav" className={this.state.open ? 'open' : 'closed'}>
				<li className="nav-item">
					{this.props.member ? (
						<button onClick={this.signOut} style={cursor}>
							<span className="arrow" />
							<span>Sign out {getFullMemberName(this.props.member)}</span>
						</button>
					) : (
						<SigninLink onClick={this.close}>
							<span className="arrow" />
							<span>Sign in</span>
						</SigninLink>
					)}
				</li>
				{/* {this.props.fullMemberDetails.error === MemberCreateError.NONE ? (
					<li className="nav-item">
						<SideNavigationLink target={'/admin/notifications'} onClick={this.close}>
							Unread Notifications: {this.props.fullMemberDetails.notificationCount}
						</SideNavigationLink>
					</li>
				) : null} */}
				<li className="nav-item">
					<button onClick={this.goBack} style={cursor}>
						<span className="arrow" />
						<span>Go back</span>
					</button>
				</li>
				{this.props.links.map((link, i) => (
					<li key={i} className="nav-item">
						{link.type === 'Link' ? (
							<SideNavigationLink target={link.target} onClick={this.close}>
								{link.text}
							</SideNavigationLink>
						) : (
							<SideNavigationReferenceLink target={link.target} onClick={this.close}>
								{link.text}
							</SideNavigationReferenceLink>
						)}
					</li>
				))}
			</ul>
		</nav>
	);

	private signOut = (): void => {
		this.props.authorizeUser({
			error: MemberCreateError.INVALID_SESSION_ID,
		});
		void fetchApi.member.session.logout({}, {});
		this.close();
	};

	private goBack = (): void => {
		this.props.history.goBack();
		this.close();
	};

	private toggleOpen = (): void => {
		if (this.state.open) {
			this.close();
		} else {
			this.open();
		}
	};

	private open = (): void => {
		if (isMobile()) {
			if (this.menuRef.current) {
				if (this.state.stuck) {
					$(this.menuRef.current).animate(
						{
							height: '100%',
						},
						200,
						'linear',
					);
				} else {
					$(this.menuRef.current).animate(
						{
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							height: $(window).height()! - (sidenavOffset - $(window).scrollTop()!),
						},
						200,
						'linear',
					);
				}
			}
		}
		this.setState({
			open: true,
		});
	};

	private close = (): void => {
		if (isMobile()) {
			if (this.menuRef.current) {
				$(this.menuRef.current).animate(
					{
						height: 45,
					},
					200,
					'linear',
				);
			}
		}
		this.setState({
			open: false,
		});
	};

	private handleScroll = (): void => {
		if (isMobile()) {
			const scroll = $(window).scrollTop();
			if (scroll && scroll > sidenavOffset) {
				this.setState({
					stuck: true,
				});
			} else if (this.state.stuck) {
				this.setState({
					stuck: false,
				});
			}

			if (this.state.open) {
				if (this.state.stuck) {
					if (this.menuRef.current) {
						$(this.menuRef.current).css({
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							height: $(window).height()!,
						});
					}
				} else {
					if (this.menuRef.current) {
						$(this.menuRef.current).css({
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							height: $(window).height()! - (sidenavOffset - $(window).scrollTop()!),
						});
					}
				}
			} else {
				if (this.menuRef.current) {
					$(this.menuRef.current).css({
						height: 45,
					});
				}
			}
		}
	};
}

export default withRouter(SideNavigation);
