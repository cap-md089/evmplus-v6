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
	TeamSelector,
	MemberSelector,
	TeamMemberInput
} from './SimpleForm';

export { Label, Title } from './SimpleForm';
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
	TeamSelector,
	MemberSelector,
	TeamMemberInput
};

const clearFix: React.CSSProperties = {
	clear: 'both'
};

export interface BasicFormProps<T> extends FormProps<T> {
	/**
	 * Class names for each row
	 */
	rowClassName?: string;
	/**
	 * Class for the form
	 */
	className?: string;
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
class Form<C = {}, P extends BasicFormProps<C> = BasicFormProps<C>> extends SimpleForm<C, P> {
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
			<form
				onSubmit={this.submit}
				className={`${this.props.className ? `${this.props.className} ` : ''}`}
			>
				{React.Children.map(this.props.children, (child: React.ReactChild, i) => {
					if (isInput(child)) {
						const childName: keyof C = child.props.name as keyof C;
						const value =
							typeof this.props.values !== 'undefined'
								? typeof (this.props.values as C)[childName] === 'undefined'
									? ''
									: (this.props.values as C)[childName]
								: typeof child.props.value === 'undefined'
								? ''
								: child.props.value;
						return (
							<div className={this.props.rowClassName || 'basic-form-bar'}>
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
				})}
				<div className={this.props.rowClassName || 'basic-form-bar'}>
					<input
						type="submit"
						value={submitInfo.text}
						className={submitInfo.className}
						disabled={this.state.disabled || submitInfo.disabled}
					/>
				</div>
				<div style={clearFix} />
			</form>
		);
	}
}

export default Form;
