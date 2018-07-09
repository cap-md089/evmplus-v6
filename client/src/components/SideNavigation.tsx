import * as React from 'react';
import { Link } from 'react-router-dom';

import * as $ from 'jquery';

import SigninLink from './SigninLink';

export class SideNavigationLink extends React.Component<{target: string}> {
	public render () {
		return (
			<Link
				to={this.props.target}
			>
				<span className="arrow" />
				<span>
					{this.props.children}
				</span>
			</Link>
		)
	}
}
export class SideNavigationReferenceLink extends React.Component<{target: string}> {
	public render() {
		return (
			<a
				href={`#${this.props.target}`}
				onClick={
					(e: React.MouseEvent<HTMLElement>) => {
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
					}
				}
			>
				<span className="arrow" />
				<span>
					{this.props.children}
				</span>
			</a>
		);
	}
}

export interface SideNavigationState {
	links: JSX.Element[],
	member: {
		valid: boolean,
		error: string
	}
}

export class SideNavigation extends React.Component<SideNavigationState, {}> {
	public render () {
		return (
			<div id="sidenav">
				<ul id="nav">
					<li>
						<SigninLink {...this.props.member}>
							<span className="arrow" /><span>Sign in</span>
						</SigninLink>
					</li>
					{
						this.props.links.map((link, i) => <li key={i}>{link}</li>)
					}
				</ul>
			</div>
		);
	}
}

export default SideNavigation;