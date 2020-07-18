import { getFullMemberName, MemberCreateError, SigninReturn, User } from 'common-lib';
import $ from 'jquery';
import * as React from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import SigninLink from '../SigninLink';
import './SideNavigation.scss';

export const isMobile = () => window.innerWidth < 1028;

class SideNavigationLink extends React.Component<{ target: string; onClick: () => void }> {
	public render() {
		return (
			<Link to={this.props.target} onClick={this.props.onClick}>
				<span className="arrow" />
				<span>{this.props.children}</span>
			</Link>
		);
	}
}
class SideNavigationReferenceLink extends React.Component<{
	target: string;
	onClick: () => void;
}> {
	public render() {
		return (
			<a href={`#${this.props.target}`} onClick={this.props.onClick}>
				<span className="arrow" />
				<span>{this.props.children}</span>
			</a>
		);
	}
}

export type SideNavigationItem =
	| { type: 'Reference'; target: string; text: React.ReactChild }
	| { type: 'Link'; target: string; text: React.ReactChild };

export interface SideNavigationProps extends RouteComponentProps<{}> {
	links: SideNavigationItem[];
	member: User | null;
	fullMemberDetails: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
}

const cursor: React.CSSProperties = {
	cursor: 'pointer'
};

interface SideNavigationState {
	open: boolean;
	stuck: boolean;
}

const sidenavOffset = 136 + 45;

export class SideNavigation extends React.Component<SideNavigationProps, SideNavigationState> {
	public state: SideNavigationState = {
		open: false,
		stuck: false
	};

	private menuRef = React.createRef<HTMLDivElement>();

	constructor(props: SideNavigationProps) {
		super(props);

		this.toggleOpen = this.toggleOpen.bind(this);
		this.signOut = this.signOut.bind(this);
		this.goBack = this.goBack.bind(this);
		this.close = this.close.bind(this);
		this.open = this.open.bind(this);

		this.handleScroll = this.handleScroll.bind(this);
	}

	public componentDidMount() {
		window.addEventListener('scroll', this.handleScroll);
		window.addEventListener('resize', () => this.forceUpdate());
	}

	public componentWillUnmount() {
		window.removeEventListener('scroll', this.handleScroll);
		window.removeEventListener('resize', () => this.forceUpdate());
	}

	public render() {
		return (
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
					{this.props.fullMemberDetails.error === MemberCreateError.NONE ? (
						<li className="nav-item">
							<SideNavigationLink
								target={'/admin/notifications'}
								onClick={this.close}
							>
								Unread Notifications:{' '}
								{this.props.fullMemberDetails.notificationCount}
							</SideNavigationLink>
						</li>
					) : null}
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
								<SideNavigationReferenceLink
									target={link.target}
									onClick={this.close}
								>
									{link.text}
								</SideNavigationReferenceLink>
							)}
						</li>
					))}
				</ul>
			</nav>
		);
	}

	private signOut() {
		this.props.authorizeUser({
			error: MemberCreateError.INVALID_SESSION_ID
		});
		localStorage.removeItem('sessionID');
		this.close();
	}

	private goBack() {
		this.props.history.goBack();
		this.close();
	}

	private toggleOpen() {
		if (this.state.open) {
			this.close();
		} else {
			this.open();
		}
	}

	private open() {
		if (isMobile()) {
			if (this.menuRef.current) {
				if (this.state.stuck) {
					$(this.menuRef.current).animate(
						{
							height: '100%'
						},
						200,
						'linear'
					);
				} else {
					$(this.menuRef.current).animate(
						{
							height: $(window).height()! - (sidenavOffset - $(window).scrollTop()!)
						},
						200,
						'linear'
					);
				}
			}
		}
		this.setState({
			open: true
		});
	}

	private close() {
		if (isMobile()) {
			if (this.menuRef.current) {
				$(this.menuRef.current).animate(
					{
						height: 45
					},
					200,
					'linear'
				);
			}
		}
		this.setState({
			open: false
		});
	}

	private handleScroll(ev: Event) {
		if (isMobile()) {
			const scroll = $(window).scrollTop();
			if (scroll && scroll > sidenavOffset) {
				this.setState({
					stuck: true
				});
			} else if (this.state.stuck) {
				this.setState({
					stuck: false
				});
			}

			if (this.state.open) {
				if (this.state.stuck) {
					if (this.menuRef.current) {
						$(this.menuRef.current).css({
							height: $(window).height()!
						});
					}
				} else {
					if (this.menuRef.current) {
						$(this.menuRef.current).css({
							height: $(window).height()! - (sidenavOffset - $(window).scrollTop()!)
						});
					}
				}
			} else {
				if (this.menuRef.current) {
					$(this.menuRef.current).css({
						height: 45
					});
				}
			}
		}
	}
}

export default withRouter(SideNavigation);
