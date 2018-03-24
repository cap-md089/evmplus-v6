import * as React from 'react';

import Form, { Label, TextInput, Title, FileInput, TextArea } from '../components/Form';
import Button from '../components/Button';

export default class Test extends React.Component<{}, {}> {
	render () {
		type TestForm = new () => Form<{
			test1: string;
			test2: string;
			test3: string;
			test4: string[];
		}>;
		let TestForm = Form as TestForm;

		return (
			<div>
				<TestForm
					onSubmit={
						(data) => {
							console.log(data);
						}
					}
					id="aLongTestForm"
					submitInfo={{
						text: 'Click me'
					}}
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
					File label
					<FileInput
						name="test4"
					>
						Upload files
					</FileInput>
					<TextArea
						name="test5"
					/>
				</TestForm>
				<Button 
					data={
						{
							hi: true
						}
					}
					url={'/api/echo'}
					onClick={console.log}
					onReceiveData={console.log}
					buttonType={''}
				>
					Submit
				</Button>
			</div>
		);
	}
}