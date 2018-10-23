import * as React from 'react';
import myFetch from '../lib/myFetch';
import urlFormat from '../lib/urlFormat';
import Dialogue, { DialogueButtons } from './Dialogue';
import Selector, { CheckInput } from './form-inputs/Selector';

interface DownloadProps<T extends Identifiable> {
	// Request properties
	member: SigninReturn;
	requestProperties?: RequestInit;
	errorMessage?: string;
	url: string;

	// Properties for the dialogue
	open: boolean;
	title: string;

	// Properties for the selector
	showIDField?: boolean;
	filters?: Array<CheckInput<T>>;
	values: T[];
	onChangeVisible?: (visible: T[]) => void;
	overflow?: number;
	filterValues?: any[];
	onFilterValuesChange?: (filterValues: any[]) => void;
	displayValue: (value: T) => React.ReactChild;
}

interface DownloadPropsSingle<T extends Identifiable> extends DownloadProps<T> {
	multiple: false;
	onValueClick: (value: T | null) => void;
	onValueSelect: (value: T | null) => void;
	selectedValue: T;
}

interface DownloadPropsMultiple<T extends Identifiable>
	extends DownloadProps<T> {
	multiple: true;
	onValuesClick: (values: T[]) => void;
	onValuesSelect: (values: T[]) => void;
	selectedValues: T[];
}

type DownloadDialogueProps<T extends Identifiable> =
	| DownloadPropsMultiple<T>
	| DownloadPropsSingle<T>;

interface DownloadDialogueState<T> {
	values: T[] | null;
	selectedValues: T[];
}

export default class DownloadDialogue<
	T extends Identifiable
> extends React.Component<DownloadDialogueProps<T>, DownloadDialogueState<T>> {
	public state: DownloadDialogueState<T> = {
		values: null,
		selectedValues: []
	};

	constructor(props: DownloadDialogueProps<T>) {
		super(props);

		this.onOk = this.onOk.bind(this);
		this.onCancel = this.onCancel.bind(this);
	}

	public componentDidMount() {
		if (this.props.member.valid) {
			myFetch(urlFormat('api', this.props.url), {
				headers: {
					authorization: this.props.member.sessionID
				}
			});
		}
	}

	public render() {
		if (this.state.values === null) {
			return;
		}
		
		let selector;

		if (this.props.multiple) {
			selector = (
				<Selector
					multiple={true}
					name="selector"
					showIDField={!!this.props.showIDField}
					displayValue={this.props.displayValue}
					values={this.state.values}
					filters={this.props.filters}
					filterValues={this.props.filterValues}
					value={
						this.state.selectedValues
					}
				/>
			);
		} else {
			selector = (
				<Selector
					multiple={false}
					name="selector"
					showIDField={!!this.props.showIDField}
					displayValue={this.props.displayValue}
					values={this.state.values}
					filters={this.props.filters}
					filterValues={this.props.filterValues}
					value={this.state.selectedValues[0]}
				/>
			);
		}

		return (
			<Dialogue
				open={this.props.open && this.state.values !== null}
				displayButtons={DialogueButtons.OK_CANCEL}
				labels={['Select', 'Cancel']}
				title={this.props.title}
				onClose={() => void 0}
				onOk={this.onOk}
				onCancel={this.onCancel}
			>
				{selector}
			</Dialogue>
		);
	}

	protected hasValue(value: T): boolean {
		let ret = false;

		if (this.props.multiple) {
			this.props.selectedValues.forEach(selected => {
				if (value.id === selected.id) {
					ret = true;
				}
			});
		} else {
			ret = this.props.selectedValue.id === value.id;
		}

		return ret;
	}

	private onOk() {
		if (this.props.multiple) {
			this.props.onValuesSelect(
				this.state.values!.filter(val => this.hasValue(val))
			);
		} else {
			this.props.onValueSelect(this.props.selectedValue);
		}
	}

	private onCancel() {
		if (this.props.multiple) {
			this.props.onValuesSelect([] as T[]);
		} else {
			this.props.onValueSelect(null);
		}
	}
}
