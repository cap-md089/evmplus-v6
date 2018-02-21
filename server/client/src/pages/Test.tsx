import * as React from 'react';

import Form, { Label, TextInput, Title } from '../components/Form';

export default class Test extends React.Component<{}, {}> {
	render () {
		type TestForm = new () => Form<{
			test1: string;
			test2: string;
			test3: string;
		}>;
		let TestForm = Form as TestForm;

		return (
			<TestForm
				onSubmit={
					(data) => {
						console.log(data);
					}
				}
				id="aLongTestForm"
				// submitInfo={{
				// 	text: 'Click me'
				// }}
			>
				<Label>
					Input label
				</Label>
				<TextInput 
					onChange={
						(text) => {
							if (typeof text === 'undefined') {
								return;
							}
							console.log(text.currentTarget.value);
						}
					}
					name="test1"
				/>
				<Title>
					A title
				</Title>
				A label
				<TextInput name="test2" />
				<TextInput name="test3" />
			</TestForm>
		);
	}
}