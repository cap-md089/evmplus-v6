import * as React from 'react';
import BigTextBox from './form-inputs/BigTextBox';
// Form inputs
import Checkbox from './form-inputs/Checkbox';
import DateTimeInput from './form-inputs/DateTimeInput';
import FileInput from './form-inputs/FileInput';
import FormBlock from './form-inputs/FormBlock';
import { InputProps } from './form-inputs/Input';
import ListEditor from './form-inputs/ListEditor';
import LoadingTextArea from './form-inputs/LoadingTextArea';
import MultCheckbox from './form-inputs/MultCheckbox';
import MultiRange from './form-inputs/MultiRange';
import NumberInput from './form-inputs/NumberInput';
import RadioButton from './form-inputs/RadioButton';
import Selector from './form-inputs/Selector';
import SimpleRadioButton from './form-inputs/SimpleRadioButton';
import TextBox from './form-inputs/TextBox';
import TextInput from './form-inputs/TextInput';
import DisabledMappedText from './form-inputs/DisabledMappedText';

let TextArea: typeof import('./form-inputs/TextArea').default;

import('./form-inputs/TextArea').then(textArea => {
	TextArea = textArea.default;
});

/**
 * Creates a label to be used in the form
 */
class Label extends React.Component<{
	fullWidth?: boolean;
	style?: React.CSSProperties;
	id?: string;
}> {
	public readonly IsLabel = true;

	constructor(props: { fullWidth: boolean; style?: React.CSSProperties; id: string }) {
		super(props);

		this.IsLabel = true;
	}

	public render() {
		return (
			<div className="formbox" style={this.props.style} id={this.props.id}>
				{this.props.children}
			</div>
		);
	}
}

/**
 * Creates a title to use in the form
 */
class Title extends React.Component<{ fullWidth?: boolean; id?: string }> {
	public readonly IsLabel = true;

	constructor(props: { fullWidth: boolean; id: string }) {
		super(props);

		this.IsLabel = true;
	}

	public render() {
		return (
			<div className="formbar fheader">
				<div className="formbox">
					<h3 id={this.props.id}>{this.props.children}</h3>
				</div>
			</div>
		);
	}
}

/**
 * Helper function
 *
 * @param el
 */
export function isInput(
	el: React.ReactChild | React.ReactElement<any>
): el is React.ReactElement<InputProps<any>> {
	if (typeof el === 'string' || typeof el === 'number' || el === null) {
		return false;
	}
	return (
		el.type === TextInput ||
		el.type === FileInput ||
		el.type === TextArea ||
		el.type === MultiRange ||
		el.type === DateTimeInput ||
		el.type === RadioButton ||
		el.type === MultCheckbox ||
		el.type === Checkbox ||
		el.type === ListEditor ||
		el.type === FormBlock ||
		el.type === SimpleRadioButton ||
		el.type === TextBox ||
		el.type === NumberInput ||
		el.type === Selector ||
		el.type === LoadingTextArea ||
		el.type === BigTextBox ||
		el.type === DisabledMappedText
	);
}

export const isFullWidthableElement = (
	el: React.ReactElement<InputProps<any>>
): el is React.ReactElement<InputProps<any> & { fullWidth: boolean }> =>
	// @ts-ignore
	typeof el.props.fullWidth !== 'undefined';

/**
 * Similar helper function
 *
 * @param el
 */
export function isLabel(el: React.ReactChild): el is React.ReactElement<any> {
	if (typeof el === 'string' || typeof el === 'number' || el === null) {
		return false;
	}
	return el.type === Title || el.type === Label;
}

/**
 * The properties a form itself requires
 */
export interface FormProps<F> {
	/**
	 * The function that is called when the user submits the form
	 *
	 * @param fields The fields of the form
	 */
	onSubmit?: (fields: F) => void;
	/**
	 * Styles the submit button
	 */
	submitInfo?: {
		/**
		 * The text for the submit button to use
		 */
		text: string;
		/**
		 * A CSS class to use
		 */
		className?: string;
		/**
		 * Whether or not the button is to be disabled
		 */
		disabled?: boolean;
	};
	/**
	 * The ID to identify the form with CSS
	 *
	 * Also used to 'save' the form; make it long so that it is unique!
	 */
	id: string;
	/**
	 * Determines whether or not to load a previously saved form
	 *
	 * @param saveTime How long ago was the form saved
	 * @param fields The fields to look at
	 *
	 * @returns Whether or not to load a previous save
	 */
	shouldLoadPreviousFields?: (saveTime: number, fields: F) => boolean;
	/**
	 * Replaces the previous property
	 *
	 * Basically makes it so it uses a function that checks whether or not saveTime
	 * is less than the value specified
	 */
	saveCheckTime?: number;
	/**
	 * What to do on a form value changing
	 *
	 * Can be used to help with checking if a form field should be disabled
	 */
	onChange?: (fields: F) => void;
	/**
	 * Type checking for children!
	 */
	children?: JSX.Element[] | JSX.Element;
	/**
	 * Sets the values given the name. Allows for not having to set form values repeatedly
	 */
	values?: F;
	/**
	 * Whether or not to show a submit button. This is nice for when a submit button is not
	 * nessecary
	 */
	showSubmitButton?: boolean;
}

/**
 * The form itself
 *
 * To use with type checking in the submit function, you can do something similar to the following:
 * @example
 * type SampleForm = new () => Form<{x: string}>
 * let SampleForm = Form as SampleForm // Sometimes `as any as Sampleform`
 * // <SampleForm /> now works as Form<{x: string}>
 */
class SimpleForm<
	C = {},
	P extends FormProps<C> = FormProps<C>
> extends React.Component<
	P,
	{
		disabled: boolean;
	}
> {
	protected fields = {} as C;

	protected token: string = '';
	protected sessionID: string = '';

	protected displayLoadFields: boolean = false;
	protected loadedFields: C = {} as C;

	/**
	 * Create a form
	 *
	 * ID is required
	 * SubmitInfo describes the submit button
	 * onSubmit is the callback to use when the form is submitted
	 *
	 * @param {P} props The properties
	 */
	constructor(props: P) {
		super(props);

		this.state = {
			disabled: false
		};

		this.onChange = this.onChange.bind(this);
		this.onInitialize = this.onInitialize.bind(this);
		this.submit = this.submit.bind(this);

		this.fields = {} as C;

		if (typeof localStorage !== 'undefined') {
			const fields = localStorage.getItem(`${this.props.id}-storage`);
			let time = 0;

			const saveTime = localStorage.getItem(`${this.props.id}-savetime`);
			if (saveTime) {
				time = Date.now() - parseInt(saveTime, 10);

				if (this.props.shouldLoadPreviousFields) {
					this.displayLoadFields = this.props.shouldLoadPreviousFields(
						time,
						fields ? JSON.parse(fields) : {}
					);
				} else if (typeof this.props.saveCheckTime !== 'undefined') {
					this.displayLoadFields = time < 1000 * 60 * 60 * 5;
				}
			} else {
				this.displayLoadFields = false;
			}
		} else {
			this.displayLoadFields = true;
		}
	}

	/**
	 * Render function for a React Component
	 *
	 * @returns {JSX.Element} A form
	 */
	public render(): JSX.Element {
		const submitInfo =
			this.props.submitInfo === undefined
				? {
						text: 'Submit',
						className: 'submit',
						disabled: false
				  }
				: Object.assign(
						{
							text: 'Submit',
							className: 'submit',
							disabled: false
						},
						this.props.submitInfo
				  );

		return (
			<form onSubmit={this.submit} className="asyncForm">
				{React.Children.map(
					this.props.children,
					(child: React.ReactChild, i) => {
						if (
							typeof this.props.children === 'undefined' ||
							this.props.children === null
						) {
							throw new TypeError('Some error occurred');
						}
						let ret;
						let fullWidth = false;
						if (!isInput(child)) {
							// This algorithm handles labels for inputs by handling inputs
							// Puts out titles on their own line
							// Disregards spare labels and such
							if (isLabel(child) && child.type === Title) {
								return child;
							}
							return;
						} else {
							const value =
								typeof this.props.values !== 'undefined'
									? typeof this.props.values[
											child.props.name
									  ] === 'undefined'
										? ''
										: this.props.values[child.props.name]
									: typeof child.props.value === 'undefined'
										? ''
										: child.props.value;
							if (!this.fields[child.props.name]) {
								this.fields[child.props.name] = value;
							}
							if (isFullWidthableElement(child)) {
								fullWidth = child.props.fullWidth;
							}
							if (typeof fullWidth === 'undefined') {
								fullWidth = false;
							}
							ret = [
								React.cloneElement(child, {
									onUpdate: this.onChange,
									onInitialize: this.onInitialize,
									key: i + 1,
									value
								})
							];
						}
						if (
							i > 0 &&
							typeof (this.props.children as React.ReactChild[])[
								i - 1
							] !== 'undefined' &&
							!isInput(
								(this.props.children as React.ReactChild[])[
									i - 1
								]
							)
						) {
							if (
								typeof this.props.children[i - 1] ===
									'string' ||
								typeof this.props.children[i - 1] === 'number'
							) {
								ret.unshift(
									<Label key={i - 1} fullWidth={fullWidth}>
										{this.props.children[i - 1]}
									</Label>
								);
							} else {
								if (this.props.children[i - 1].type !== Title) {
									ret.unshift(
										// @ts-ignore
										React.cloneElement(
											this.props.children[i - 1],
											{
												onUpdate: this.onChange,
												onInitialize: this.onInitialize,
												key: i
											}
										)
									);
								}
							}
						} else {
							ret.unshift(
								<div
									className="formbox"
									style={{
										height: 2
									}}
									key={i - 1}
								/>
							);
						}

						return (
							<div key={i} className="formbar">
								{ret}
							</div>
						);
					}
				)}
				{(typeof this.props.showSubmitButton === 'undefined' ? true : this.props.showSubmitButton )? (
					<div className="formbar">
						<div
							className="formbox"
							style={{
								height: '2px'
							}}
						/>
						<div className="formbox">
							<input
								type="submit"
								value={submitInfo.text}
								className={submitInfo.className}
								disabled={
									this.state.disabled || submitInfo.disabled
								}
							/>
						</div>
					</div>
				) : null}
				<div
					style={{
						overflow: 'auto',
						clear: 'both',
						height: 1
					}}
				/>
			</form>
		);
	}

	/**
	 * What is used to describe when a form element changes
	 */
	protected onChange(e: { name: string; value: any }) {
		this.fields[e.name] = e.value;
		if (this.props.onChange) {
			this.props.onChange(this.fields);
		}
	}

	protected onInitialize(e: { name: string; value: any }) {
		this.fields[e.name] = e.value;
		if (this.props.onChange) {
			this.props.onChange(this.fields);
		}
	}

	/**
	 * Function called when the form is submitted
	 *
	 * @param {React.FormEvent<HTMLFormEvent>} e Event
	 */
	protected submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (typeof this.props.onSubmit !== 'undefined') {
			this.props.onSubmit(this.fields);
		}
	}
}

export default SimpleForm;

export {
	Title,
	Label,
	FileInput,
	MultiRange,
	TextInput,
	DateTimeInput,
	RadioButton,
	MultCheckbox,
	Checkbox,
	ListEditor,
	FormBlock,
	SimpleRadioButton,
	TextBox,
	NumberInput,
	Selector,
	LoadingTextArea,
	DisabledMappedText,
	BigTextBox
};
