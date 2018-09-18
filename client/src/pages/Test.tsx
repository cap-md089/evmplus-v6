import { convertToRaw, EditorState, RawDraftContentState } from 'draft-js';
import { DateTime } from 'luxon';
import * as React from 'react';
import Button from '../components/Button';
import Form, {
	Checkbox,
	DateTimeInput,
	FileInput,
	FormBlock,
	Label,
	MultCheckbox,
	MultiRange,
	RadioButton,
	Selector,
	TextArea,
	TextInput,
	Title
} from '../components/SimpleForm';
import Page, { PageProps } from './Page';

enum Test1 {
	Opt1,
	Opt2
}

interface Complex extends Identifiable {
	id: number;
	value: string;
}

interface Props {
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
	test11: RadioReturn<Test1>;
	test12: MultCheckboxReturn;
	test13: boolean;
	test14: RawDraftContentState;
	test15: {
		'test15-1': string;
		'test15-2': string;
	};
	test16: Complex[];
}

export default class Test extends Page<
	PageProps<{}>,
	{ open: boolean } & Props
> {
	public state: Props & { open: boolean } = {
		open: true,
		test1: '',
		test2: '',
		test3: '',
		test4: [],
		test5: convertToRaw(EditorState.createEmpty().getCurrentContent()),
		test6: '',
		test7: [100, 200],
		test8: DateTime.utc(),
		test9: DateTime.utc(),
		test10: DateTime.utc(),
		test11: [-1, ''],
		test12: [[false, false, false], ''],
		test13: false,
		test14: convertToRaw(EditorState.createEmpty().getCurrentContent()),
		test15: {
			'test15-1': '',
			'test15-2': ''
		},
		test16: []
	};

	public render() {
		const TestForm = Form as new () => Form<Props>;

		const TestButton = Button as new () => Button<
			{
				hi: boolean;
			},
			{
				hi: boolean;
			}
		>;

		const TestSelector = Selector as new () => Selector<Complex>;

		return (
			<div>
				{this.props.member.valid
					? JSON.stringify(this.props.member)
					: 'false'}
				<TestForm
					onSubmit={data => {
						// tslint:disable-next-line:no-console
						console.log(data);
						// tslint:disable-next-line:no-console
						console.log(this.state);
					}}
					id="aLongTestForm"
					submitInfo={{
						text: 'Click me'
					}}
					onChange={data => {
						this.setState({ ...data });
					}}
				>
					<Label>Time input</Label>
					<DateTimeInput
						name="test8"
						date={false}
						time={true}
						value={this.state.test8}
						originalTimeZoneOffset={'America/New_York'}
					/>
					<Label>Date input</Label>
					<DateTimeInput
						name="test9"
						date={true}
						time={false}
						value={this.state.test9}
						originalTimeZoneOffset={'America/New_York'}
					/>
					<Label>Date and time input</Label>
					<DateTimeInput
						name="test10"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
						value={this.state.test10}
					/>
					<Label>Input label</Label>
					<TextInput
						value={this.state.test1}
						onChange={text =>
							text.startsWith('a') || text.length === 0
						}
						name="test1"
					/>
					<Title>A title</Title>
					<Label>A label</Label>
					<TextInput name="test2" value={this.state.test2} />
					<TextInput name="test3" value={this.state.test3} />
					<Label>File label</Label>
					<FileInput name="test4" value={this.state.test4} />
					<TextInput
						name="test6"
						fullWidth={true}
						placeholder="Post title..."
						boxStyles={{
							margin: 0,
							marginBottom: -11,
							padding: 0
						}}
						inputStyles={{
							backgroundColor: '#fff',
							borderBottomWidth: 0,
							borderColor: '#aaa',
							borderRadius: 0,
							padding: 10
						}}
						value={this.state.test6}
					/>
					<TextArea
						name="test5"
						fullWidth={true}
						value={this.state.test5}
					/>
					<Label>Not full width textarea</Label>
					<TextArea name="test14" value={this.state.test14} />
					<MultiRange
						name="test7"
						min={100}
						max={200}
						step={10}
						rightDisplay={(low, high) => `${high}`}
						leftDisplay={(low, high) => `${low}`}
						value={this.state.test7}
					/>
					<RadioButton
						labels={['Opt1', 'Opt2']}
						other={true}
						name="test11"
						onChange={el => {
							if (el[0] === Test1.Opt1) {
								// tslint:disable-next-line:no-console
								console.log('opt 1');
							}
						}}
						value={this.state.test11}
					/>
					<Label>Multiple checkboxes</Label>
					<MultCheckbox
						labels={['Opt 1', 'Opt 2']}
						other={true}
						name="test12"
						value={this.state.test12}
					/>
					<Label>Single checkbox</Label>
					<Checkbox name="test13" value={this.state.test13} />
					<FormBlock name="test15">
						<TextInput
							name="test15-1"
							value={this.state.test15['test15-1']}
						/>
						<TextInput
							name="test15-2"
							value={this.state.test15['test15-2']}
						/>
					</FormBlock>
					<Label>Selector</Label>
					<TestSelector
						values={[
							{
								id: 0,
								value: 'val1'
							},
							{
								id: 1,
								value: 'val2'
							},
							{
								id: 2,
								value: 'val3'
							}
						]}
						name="test16"
						value={this.state.test16}
						displayValue={val => val.value}
						onChange={console.log}
						// @ts-ignore
						filters={[
							{
								displayText: 'Value: ',
								filterInput: TextInput,
								check: (val, input) => {
									if (input === '') {
										return true;
									}

									const ret = !!val.value.match(new RegExp(input, 'i'));

									return ret;
								}
							}
						]}
						multiple={true}
						showIDField={false}
					/>
				</TestForm>
				<TestButton
					data={{
						hi: true
					}}
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
