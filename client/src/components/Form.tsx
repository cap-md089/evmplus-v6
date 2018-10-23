import * as React from 'react';
import myFetch from '../lib/myFetch';
import {
	Checkbox,
	DateTimeInput,
	FileInput,
	FormBlock,
	FormProps,
	isInput,
	ListEditor,
	LoadingTextArea,
	MultCheckbox,
	MultiRange,
	NumberInput,
	RadioButton,
	Selector,
	SimpleRadioButton,
	TextInput
} from './SimpleForm';

export { FormProps, Label, Title } from './SimpleForm';
export {
	LoadingTextArea,
	FileInput,
	TextInput,
	MultiRange,
	DateTimeInput,
	RadioButton,
	MultCheckbox,
	Checkbox,
	ListEditor,
	FormBlock,
	SimpleRadioButton,
	NumberInput,
	Selector
};

export interface BasicFormProps<T> extends FormProps<T> {
	rowClassName?: string;
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
class Form<
	C = {},
	P extends BasicFormProps<C> = BasicFormProps<C>
> extends React.Component<
	P,
	{
		disabled: boolean;
	}
> {
	protected fields: C;

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

		const sid = localStorage.getItem('sessionID');
		if (sid) {
			this.sessionID = sid;
			myFetch('/api/token', {
				headers: {
					authorization: sid
				}
			})
				.then(res => {
					if (res.status !== 403) {
						return Promise.resolve(res);
					} else {
						return Promise.reject(new Error('User not signed in'));
					}
				})
				.then(res => res.json())
				.then(tokenObj => (this.token = tokenObj.token))
				.catch(e => undefined);
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
						if (isInput(child)) {
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
							return (
								<div
									className={
										this.props.rowClassName ||
										'basic-form-bar'
									}
								>
									{React.cloneElement(child, {
										onUpdate: this.onChange,
										onInitialize: this.onInitialize,
										value,
										key: i
									})}
								</div>
							);
						}
						return child;
					}
				)}
				<div className={this.props.rowClassName || 'basic-form-bar'}>
					<input
						type="submit"
						value={submitInfo.text}
						className={submitInfo.className}
						disabled={this.state.disabled || submitInfo.disabled}
					/>
				</div>
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

	/**
	 * Initialization of form components
	 */
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
			this.props.onSubmit(this.fields, this.token);
		}
	}
}

export default Form;
