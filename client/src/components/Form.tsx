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
	MultCheckbox,
	MultiRange,
	RadioButton,
	TextArea,
	TextInput
} from './SimpleForm';

export { FormProps, Label, Title } from './SimpleForm';
export {
	FileInput,
	TextInput,
	TextArea,
	MultiRange,
	DateTimeInput,
	RadioButton,
	MultCheckbox,
	Checkbox,
	ListEditor,
	FormBlock
};

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
	P extends FormProps<C> = FormProps<C>
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
					(child: React.ReactChild, i) =>
						isInput(child)
							? React.cloneElement(
									child as React.ReactElement<{
										onUpdate: (
											e: { name: string; value: any }
										) => void;
									}>,
									{
										onUpdate: this.onChange
									}
							  )
							: child
				)}
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
