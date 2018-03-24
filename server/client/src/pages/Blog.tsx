import * as React from 'react';

import { Route, RouteComponentProps } from 'react-router-dom';
import RequestForm from '../components/RequestForm';
import { TextInput } from '../components/Form';
import { connect } from 'react-redux';

class BlogList extends React.Component {

}

class BlogPost extends React.Component {
	render () {
		return (
			<>
				<h1>Post blog post</h1>
				<RequestForm 
					url="/api/blog/create"
					id="blogPostCreate"

				>
					Blog post title
					<TextInput
						name=""
					/>
				</RequestForm>
			</>
		);
	}
}

class BlogEdit extends React.Component<RouteComponentProps<{
	id: string
}>> {

}

class BlogView extends React.Component<RouteComponentProps<{
	id: string
}>> {
	render () {
		return (
			<div>{this.props.match.params.id}</div>
		);
	}
}

interface BlogProps {
	SignedInUser: {
		valid: boolean
	};
}

class Blog extends React.Component<BlogProps> {
	render() {
		return (
			<>
				<Route exact={true} path="/blog" component={BlogList} />
				<Route path="/blog/post" component={BlogPost} />
				<Route path="/blog/view/:id" component={BlogView} />
				<Route path="/blog/edit/:id" component={BlogEdit} />
			</>
		);
	}
}

const mapStateToProps = (state: {
	SignedInUser: {
		valid: boolean
	}
}) => {
	return state.SignedInUser as Partial<BlogProps>;
};

export default connect(
	mapStateToProps
)(Blog);