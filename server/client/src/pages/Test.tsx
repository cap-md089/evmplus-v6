import * as React from 'react';

import Form, { Label, TextInput } from '../components/Form';

export default class Test extends React.Component<{}, {}> {
	render () {
		return (
			<Form>
				<Label>
					Input label
				</Label>
				<TextInput 
					onChange={
						() => {
							console.log('hi');
						}
					}
				/>
			</Form>
		);
	}
}