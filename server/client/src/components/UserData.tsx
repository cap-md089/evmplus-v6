import * as React from 'react';
import { MemberObject } from '../../../src/types';
import { connect } from 'react-redux';

class UserData extends React.Component<{
	valid: boolean;
	member: MemberObject;
	sessionID: string;

	onload: (valid: boolean, mem: MemberObject, sessionID: string) => void;
}> {
	componentDidMount () {
		this.props.onload(this.props.valid, this.props.member, this.props.sessionID);
	}

	render () {
		return null;
	}
}

export default connect (
	(state: {SignedInUser: {valid: boolean, member: MemberObject, sessionID: string}}) => {
		return state.SignedInUser;
	}
)(UserData);