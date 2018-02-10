import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

export interface BreadCrumbs {
	text: string;
	target: string;
}

class BreadCrumbsPresentation extends React.Component<{
	links: BreadCrumbs[]
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

const mapStateToProps = (state: {
	BreadCrumbs: {
		links: BreadCrumbs[]
	}
} = {
	BreadCrumbs : {
		links: []
	}
}) => {
	return {
		links: state.BreadCrumbs.links
	};
};

export default connect(
	mapStateToProps
)(BreadCrumbsPresentation);