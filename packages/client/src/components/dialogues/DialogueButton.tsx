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
import Button from '../Button';
import Dialogue, { DialogueButtons } from './Dialogue';

const noop = () => void 0;

interface IsOpen {
	open: boolean;
}

interface DialogueButtonPropsBase {
	title: string;
	onClose?: () => void;
	buttonText: string;
	buttonType?: '' | 'primaryButton' | 'secondaryButton' | 'none';
	buttonClass?: string;
	disabled?: boolean;
}

interface DialogueButtonWithOK {
	title: string;
	displayButtons: DialogueButtons.OK;
	onClose?: () => void;
	labels?: [string];
}

interface DialogueButtonWithOKCancel {
	title: string;
	displayButtons: DialogueButtons.OK_CANCEL;
	onClose?: () => void;
	onOk?: () => void;
	onCancel?: () => void;
	labels?: [string, string];
}

interface DialogueButtonWithYesNoCancel {
	title: string;
	displayButtons: DialogueButtons.YES_NO_CANCEL;
	onClose?: () => void;
	onYes?: () => void;
	onNo?: () => void;
	onCancel?: () => void;
	labels?: [string, string, string];
}

interface DialogueWithOK {
	title: string;
	displayButtons: DialogueButtons.OK;
	onClose: () => void;
	labels?: [string];
}

interface DialogueWithOKCancel {
	title: string;
	displayButtons: DialogueButtons.OK_CANCEL;
	onClose: () => void;
	onOk: () => void;
	onCancel: () => void;
	labels?: [string, string];
}

interface DialogueWithYesNoCancel {
	title: string;
	displayButtons: DialogueButtons.YES_NO_CANCEL;
	onClose: () => void;
	onYes: () => void;
	onNo: () => void;
	onCancel: () => void;
	labels?: [string, string, string];
}

export type DialogueButtonProps =
	| DialogueButtonWithOK
	| DialogueButtonWithOKCancel
	| DialogueButtonWithYesNoCancel;

export default class DialogueButton extends React.Component<
	DialogueButtonProps & DialogueButtonPropsBase,
	IsOpen
> {
	public state = {
		open: false
	};

	public constructor(props: DialogueButtonProps & DialogueButtonPropsBase) {
		super(props);

		this.open = this.open.bind(this);
		this.close = this.close.bind(this);
		this.onClose = this.onClose.bind(this);
	}

	public render() {
		let dialogueProps: DialogueWithOK | DialogueWithOKCancel | DialogueWithYesNoCancel;

		const props = this.props;

		switch (props.displayButtons) {
			case DialogueButtons.OK:
				dialogueProps = {
					title: this.props.title,
					displayButtons: DialogueButtons.OK,
					onClose: this.onClose,
					labels: this.props.labels as [string]
				};
				break;

			case DialogueButtons.OK_CANCEL:
				dialogueProps = {
					title: props.title,
					displayButtons: DialogueButtons.OK_CANCEL,
					onCancel: props.onCancel || noop,
					onOk: props.onOk || noop,
					onClose: this.onClose,
					labels: this.props.labels as [string, string]
				};
				break;

			case DialogueButtons.YES_NO_CANCEL:
				dialogueProps = {
					title: this.props.title,
					displayButtons: DialogueButtons.YES_NO_CANCEL,
					onClose: this.onClose,
					onCancel: props.onCancel || noop,
					onNo: props.onNo || noop,
					onYes: props.onYes || noop,
					labels: this.props.labels as [string, string, string]
				};
				break;

			default:
				throw new Error('Invalid properties');
		}

		return (
			<>
				<Dialogue {...dialogueProps} open={this.state.open}>
					{this.props.children}
				</Dialogue>
				<Button
					disabled={this.props.disabled}
					buttonType={this.props.buttonType}
					className={this.props.buttonClass}
					onClick={this.open}
				>
					{this.props.buttonText}
				</Button>
			</>
		);
	}

	private open() {
		this.setState({
			open: true
		});
	}

	private close() {
		this.setState({
			open: false
		});
	}

	private onClose() {
		this.close();
		(this.props.onClose || noop)();
	}
}
