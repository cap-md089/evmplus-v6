import * as React from 'react';
import { Link } from 'react-router-dom';

import * as $ from 'jquery';

export enum LinkType {
	REFERENCE,
	LINK
} 

interface SideNavigationState {
	links: {
		type: LinkType,
		url: string,
		text: string
	}[];
}

export default class SideNavigation extends React.Component<{}, SideNavigationState> {
	public state: SideNavigationState = {
		links: []
	};

	render () {
		return (
			<div id="sidenav">
				<ul id="nav">
					{
						this.state.links.map((el, i) => {
							switch (el.type) {
								case LinkType.REFERENCE :
									return (
										<a
											href={`#${el.url}`}
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