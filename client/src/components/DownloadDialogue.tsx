import * as React from 'react';
import Dialogue, { DialogueButtons } from './Dialogue';
import Selector, { CheckInput } from './form-inputs/Selector';

interface DownloadProps<T extends Identifiable> {
	valuePromise: Promise<T[]>;
	// Properties for the dialogue
	open: boolean;
	title: string;

	// Properties for the selector
	showIDField?: boolean;
	filters?: Array<CheckInput<T>>;
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
	selectedValue?: T | null;
}

interface DownloadPropsMultiple<T extends Identifiable>
	extends DownloadProps<T> {
	multiple: true;
	onValuesClick: (values: T[]) => void;
	onValuesSelect: (values: T[]) => void;
	selectedValues?: T[];
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
		this.onChange = this.onChange.bind(this);
		this.onSingleChange = this.onSingleChange.bind(this);
		this.onMultipleChange = this.onMultipleChange.bind(this);
	}

	public componentDidMount() {
		this.props.valuePromise.then(values => this.setState({ values }));
	}

	public render() {
		if (this.state.values === null) {
			return null;
		}

		if (this.props.open === false) {
			return null;
		}

		let selector;
		const selectorProps = {
			name: 'selector',
			showIDField: !!this.props.showIDField,
			displayValue: this.props.displayValue,
			values: this.state.values,
			filters: this.props.filters,
			filterValues: this.props.filterValues,
			overflow: this.props.overflow,
			onFilterValuesChange: this.props.onFilterValuesChange
		};

		if (this.props.multiple) {
			selector = (
				<Selector
					{...selectorProps}
					multiple={true}
					value={
						this.props.selectedValues || this.state.selectedValues
					}
					onChange={this.onMultipleChange}
				/>
			);
		} else {
			selector = (
				<Selector
					{...selectorProps}
					multiple={false}
					value={
						this.props.selectedValue || this.state.selectedValues[0]
					}
					onChange={this.onSingleChange}
				/>
			);
		}

		return this.props.open ? (
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
		) : null;
	}

	protected hasValue(value: T): boolean {
		let ret = false;

		if (this.props.multiple) {
			(this.props.selectedValues || []).forEach(selected => {
				if (value.id === selected.id) {
					ret = true;
				}
			});
		} else {
			ret =
				!!this.props.selectedValue &&
				this.props.selectedValue.id === value.id;
		}

		return ret;
	}

	private onOk() {
		if (this.props.multiple) {
			this.props.onValuesSelect(
				this.state.values!.filter(val => this.hasValue(val))
			);
		} else {
			this.props.onValueSelect(
				this.props.selectedValue ? this.props.selectedValue : null
			);
		}
	}

	private onCancel() {
		if (this.props.multiple) {
			this.props.onValuesSelect([] as T[]);
		} else {
			this.props.onValueSelect(null);
		}
	}

	private onSingleChange(value: T) {
		this.onChange([value]);

		if (!this.props.multiple) {
			this.props.onValueClick(value);
		}
	}

	private onMultipleChange(values: T[]) {
		this.onChange(values);

		if (this.props.multiple) {
			this.props.onValuesClick(values);
		}
	}

	private onChange(selectedValues: T[]) {
		this.setState({
			selectedValues
		});
	}
}
