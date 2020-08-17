/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { DialogueButtons } from './Dialogue';
import DialogueButton from './DialogueButton';
import SimpleForm from '../forms/SimpleForm';

interface DialogueButtonPropsBase {
	title: string;
	onClose?: () => void;
	buttonText: string;
	buttonType?: '' | 'primaryButton' | 'secondaryButton' | 'none';
	buttonClass?: string;
}

interface DialogueWithOK<T> {
	title: string;
	displayButtons: DialogueButtons.OK;
	onClose?: (formValues: T) => void;
	labels?: [string];
}

interface DialogueWithOKCancel<T> {
	title: string;
	displayButtons: DialogueButtons.OK_CANCEL;
	onClose?: () => void;
	onOk?: (formValues: T) => void;
	onCancel?: () => void;
	labels?: [string, string];
}

interface DialogueWithYesNoCancel<T> {
	title: string;
	displayButtons: DialogueButtons.YES_NO_CANCEL;
	onClose?: () => void;
	onNo?: (formValues: T) => void;
	onYes?: (formValues: T) => void;
	onCancel?: () => void;
	labels?: [string, string, string];
}

interface DialogueButtonPropsOK {
	title: string;
	displayButtons: DialogueButtons.OK;
	onClose?: () => void;
	labels?: [string];
}

interface DialogueButtonPropsOKCancel {
	title: string;
	displayButtons: DialogueButtons.OK_CANCEL;
	onClose?: () => void;
	onOk?: () => void;
	onCancel?: () => void;
	labels?: [string, string];
}

interface DialogueButtonPropsYesNoCancel {
	title: string;
	displayButtons: DialogueButtons.YES_NO_CANCEL;
	onClose?: () => void;
	onYes?: () => void;
	onNo?: () => void;
	onCancel?: () => void;
	labels?: [string, string, string];
}

type DialogueButtonProps<T> =
	| DialogueWithOK<T>
	| DialogueWithOKCancel<T>
	| DialogueWithYesNoCancel<T>;

interface DialogueButtonFormValues<T> {
	open: boolean;
	formValues: T;
}

interface UsedFormProps<T> {
	values?: T;
}

export default class DialogueButtonForm<T> extends React.Component<
	DialogueButtonProps<T> & DialogueButtonPropsBase & UsedFormProps<T>,
	DialogueButtonFormValues<T>
> {
	constructor(props: DialogueButtonProps<T> & DialogueButtonPropsBase & UsedFormProps<T>) {
		super(props);

		this.state = {
			open: false,
			formValues: props.values || ({} as T),
		};

		this.formChange = this.formChange.bind(this);
		this.onOK = this.onOK.bind(this);
		this.onNo = this.onNo.bind(this);
		this.onYes = this.onYes.bind(this);
	}

	public render() {
		let dialogueProps:
			| DialogueButtonPropsOK
			| DialogueButtonPropsOKCancel
			| DialogueButtonPropsYesNoCancel;

		const props = this.props;

		switch (props.displayButtons) {
			case DialogueButtons.OK:
				dialogueProps = {
					title: this.props.title,
					displayButtons: DialogueButtons.OK,
					onClose: props.onClose,
					labels: this.props.labels as [string],
				};
				break;

			case DialogueButtons.OK_CANCEL:
				dialogueProps = {
					title: props.title,
					displayButtons: DialogueButtons.OK_CANCEL,
					onCancel: props.onCancel,
					onOk: this.onOK,
					onClose: props.onClose,
					labels: this.props.labels as [string, string],
				};
				break;

			case DialogueButtons.YES_NO_CANCEL:
				dialogueProps = {
					title: props.title,
					displayButtons: DialogueButtons.YES_NO_CANCEL,
					onCancel: props.onCancel,
					onYes: this.onYes,
					onNo: this.onNo,
					onClose: props.onClose,
					labels: this.props.labels as [string, string, string],
				};
				break;

			default:
				throw new Error('Invalid properties');
		}

		return (
			<DialogueButton
				buttonClass={this.props.buttonClass}
				buttonText={this.props.buttonText}
				buttonType={this.props.buttonType}
				{...dialogueProps}
			>
				<SimpleForm<T>
					onChange={this.formChange}
					values={this.state.formValues}
					showSubmitButton={false}
				>
					{this.props.children}
				</SimpleForm>
			</DialogueButton>
		);
	}

	private formChange(formValues: T) {
		this.setState({
			formValues,
		});
	}

	private onOK() {
		const props = this.props as DialogueWithOKCancel<T>;

		if (props.onOk) {
			props.onOk(this.state.formValues);
		}
	}

	private onNo() {
		const props = this.props as DialogueWithYesNoCancel<T>;

		if (props.onNo) {
			props.onNo(this.state.formValues);
		}
	}

	private onYes() {
		const props = this.props as DialogueWithYesNoCancel<T>;

		if (props.onYes) {
			props.onYes(this.state.formValues);
		}
	}
}
