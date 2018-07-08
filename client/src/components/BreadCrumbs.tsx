import * as React from 'react';
import { Link } from 'react-router-dom';

export interface BreadCrumb {
	text: string;
	target: string;
}

export class BreadCrumbsPresentation extends React.Component<{
	links: BreadCrumb[]
}, {}> {
	render () {
		return (
			<div id="breadcrumbs">
				<ul>
					{
						this.props.links.map((link, i) => {
							if (i === 0) {
								return (
									<li key={i}>
										<Link to={link.target}>
											{link.text}
										</Link>
									</li>
								);
							} else {
								return [
									<li key={'d' + i} className="divider" />,
									<li key={i}>
										<Link to={link.target}>
											{link.text}
										</Link>
									</li>
								];
							}
						})
					}
				</ul>
			</div>
		);
	}
}

export default BreadCrumbsPresentation;