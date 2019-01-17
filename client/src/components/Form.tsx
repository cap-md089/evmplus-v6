import * as React from 'react';
import SimpleForm, {
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
	TextInput,
	BigTextBox,
	DisabledMappedText,
	DisabledText,
	TeamSelector
} from './SimpleForm';

export { FormProps, Label, Title } from './SimpleForm';
export {
	Checkbox,
	DateTimeInput,
	FileInput,
	FormBlock,
	isInput,
	ListEditor,
	LoadingTextArea,
	MultCheckbox,
	MultiRange,
	NumberInput,
	RadioButton,
	Selector,
	SimpleRadioButton,
	TextInput,
	BigTextBox,
	DisabledText,
	DisabledMappedText,
	TeamSelector
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
> extends SimpleForm<C, P> {
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
}

export default Form;
