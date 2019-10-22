import * as React from 'react';
import { Link } from 'react-router-dom';

export interface BreadCrumb {
	text: string;
	target: string;
}

const dividerStyle: React.CSSProperties = {
	margin: '2px 10px',
	padding: '0 1px 0 1px',
	color: '#999'
};

export class BreadCrumbsPresentation extends React.Component<
	{
		links: BreadCrumb[];
	},
	{}
> {
	public render() {
		return (
			<div id="breadcrumbs">
				<ul>
					{this.props.links.map((link, i) => {
						if (i === 0) {
							return (
								<li key={i}>
									<Link to={link.target}>{link.text}</Link>
								</li>
							);
						} else {
							return [
								<li key={'d' + i} style={dividerStyle}>
									/
								</li>,
								<li key={i}>
									<Link to={link.target}>{link.text}</Link>
								</li>
							];
						}
					})}
				</ul>
			</div>
		);
	}
}

export default BreadCrumbsPresentation;
