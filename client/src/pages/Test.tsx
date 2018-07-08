import * as React from 'react';

import Form, {
	Label,
	TextInput,
	Title,
	TextArea,
	FileInput,
	MultiRange,
	DateTimeInput
} from '../components/SimpleForm';
import Button from '../components/Button';
import { RawDraftContentState } from 'draft-js';
import * as moment from 'moment';
import today from '../lib/today';

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
			test5: RawDraftContentState;
			test7: [number, number];
			test8: moment.Moment;
			test9: moment.Moment;
			test10: moment.Moment;
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
					<Label>Time input</Label>
					<DateTimeInput
						name="test8"
						date={false}
						time={true}
						value={moment()}
					/>
					<Label>Date input</Label>
					<DateTimeInput
						name="test9"
						date={true}
						time={false}
						value={today()}
					/>
					<Label>Date and time input</Label>
					<DateTimeInput
						name="test10"
						date={true}
						time={true}
					/>
					<Label>
						Input label
					</Label>
					<TextInput 
						onChange={text => text.startsWith('a') || text.length === 0}
						name="test1"
					/>
					<Title>
						A title
					</Title>
					<Label>A label</Label>
					<TextInput name="test2" />
					<TextInput name="test3" />
					<Label>File label</Label>
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
					<MultiRange
						name="test7"
						min={100}
						max={200}
						step={10}
						rightDisplay={(low, high) => `${high}`}
						leftDisplay={(low, high) => `${low}`}
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