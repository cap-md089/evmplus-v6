import * as React from 'react';
import { Link } from 'react-router-dom';

import * as $ from 'jquery';
import { connect } from 'react-redux';

import SigninLink from './SigninLink';

export enum LinkType {
	REFERENCE,
	LINK
} 

export interface SideNavigationState {
	links: {
		type: LinkType,
		url: string,
		text: string
	}[];
}

export class SideNavigation extends React.Component<SideNavigationState, {}> {
	render () {
		return (
			<div id="sidenav">
				<ul id="nav">
					<li>
						<SigninLink>
							<span className="arrow" /><span>Sign in</span>
						</SigninLink>
					</li>
					{
						this.props.links.map((el, i) => {
							switch (el.type) {
								case LinkType.REFERENCE :
									return (
										<a
											href={`#${el.url}`}
											key={i}
											onClick={
												(e: React.MouseEvent<HTMLElement>) => {
													e.preventDefault();
													let offset = $(e.target).offset();
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
												{el.text}
											</span>
										</a>
									);
								case LinkType.LINK :
									return (
										<Link
											to={el.url}
											key={i}
										>
											<span className="arrow" />
											<span>
												{el.text}
											</span>
										</Link>
									);
								default :
									return null;
							}
						})
					}
				</ul>
			</div>
		);
	}
}

const mapStateToProps = (state: {
	SideNavigation: SideNavigationState
}) => {
	return state.SideNavigation;
};

export default connect(
	mapStateToProps
)(SideNavigation);