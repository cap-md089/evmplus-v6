import * as React from 'react';
import { InputProps } from './Input';

export default class DisabledText extends React.Component<InputProps<string>> {
	public render() {
		return (
			<div className="formbox">
				<input
					type="text"
					value={this.props.value || ''}
					name={'disabledinput'}
					disabled={true}
				/>
			</div>
		);
	}
}
