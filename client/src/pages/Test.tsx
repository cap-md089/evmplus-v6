import { RawDraftContentState } from 'draft-js';
import { DateTime } from 'luxon';
import * as React from 'react';
import Button from '../components/Button';
import Form, { DateTimeInput, FileInput, Label, MultiRange, TextArea, TextInput, Title } from '../components/SimpleForm';
import today from '../lib/today';
import Page, { PageProps } from './Page';

export default class Test extends Page<PageProps<{}>, {open: boolean}> {
	public state = {
		open: true
	};

	public render () {
		const TestForm = Form as new () => Form<{
			test1: string;
			test2: string;
			test3: string;
			test4: string[];
			test6: string;
			test5: RawDraftContentState;
			test7: [number, number];
			test8: DateTime;
			test9: DateTime;
			test10: DateTime;
		}>;

		const TestButton = Button as new () => Button<{
			hi: boolean
		}, {
			hi: boolean
		}>;

		return (
			<div>
				<TestForm
					onSubmit={
						(data) => {
							// tslint:disable-next-line:no-console
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
						value={DateTime.utc()}
						originalTimeZoneOffset={'America/New_York'}
					/>
					<Label>Date input</Label>
					<DateTimeInput
						name="test9"
						date={true}
						time={false}
						value={today()}
						originalTimeZoneOffset={'America/New_York'}
					/>
					<Label>Date and time input</Label>
					<DateTimeInput
						name="test10"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
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
							marginBottom: -11,
							padding: 0,
						}}
						inputStyles={{
							backgroundColor: '#fff',
							borderBottomWidth: 0,
							borderColor: '#aaa',
							borderRadius: 0,
							padding: 10,
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