import * as React from 'react';
import { InputProps } from './Input';

export default class TextBox extends React.Component<InputProps<null>> {
	public render () {
		return (
			<div className="formbox" style={{lineHeight: 'initial', paddingTop: 2, paddingBottom: 5}}>
				{this.props.children}
			</div>
		);
	}
}