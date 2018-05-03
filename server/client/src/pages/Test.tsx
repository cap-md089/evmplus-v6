import * as React from 'react';

import Form, { Label, TextInput, FileInputLoaderSelect, Title, TextArea } from '../components/Form';
import Button from '../components/Button';
import { RawDraftContentState } from 'draft-js';

export default class Test extends React.Component<{}, {}> {
	render () {
		let TestForm = Form as new () => Form<{
			test1: string;
			test2: string;
			test3: string;
			test4: string[];
			test6: string;
			test5: RawDraftContentState
		}>;

		let TestButton = Button as new () => Button<{
			hi: boolean
		}, {
			hi: boolean
		}>;
		
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
					<FileInputLoaderSelect
						name="test4"
						value={[
							'test1',
							'test2'
						]}
						displaySelect={true}
					>
						Upload files
					</FileInputLoaderSelect>
					<TextInput
						name="test6"
						fullWidth={true}
						placeholder="Post title..."
						boxStyles={{
							margin: 0,
							padding: 0,
							marginBottom: -11
						}}
						inputStyles={{
							backgroundColor: '#fff',
							borderRadius: 0,
							padding: 10,
							borderBottomWidth: 0,
							borderColor: '#aaa'
						}}
					/>
					<TextArea
						name="test5"
						fullWidth={true}
					/>
				</TestForm>
				<TestButton 
					data={
						{
							hi: true
						}
					}
					url={'/api/echo'}
					onClick={console.log}
					onReceiveData={console.log}
				>
					Submit
				</TestButton>
			</div>
		);
	}
}