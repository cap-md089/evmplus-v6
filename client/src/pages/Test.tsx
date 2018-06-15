import * as React from 'react';

import Form, { Label, TextInput, Title, TextArea, FileInput } from '../components/SimpleForm';
import Button from '../components/Button';
import { RawDraftContentState } from 'draft-js';
import FileDialogue from '../components/FileDialogue';
import { FileObject } from '../types';

export default class Test extends React.Component<{}, {open: boolean}> {
	state = {
		open: true
	};

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
				<FileDialogue
					open={this.state.open}
					onReturn={
						(values: FileObject[]) => {
							console.log(values);
							this.setState({open: false});
						}
					}
				/>
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
								console.log(text);
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
						value={[
							'mdx89-41736954-9a9d-4cef-9e58-049f934d5b96'
						]}
					/>
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