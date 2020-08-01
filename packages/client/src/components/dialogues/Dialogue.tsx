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
import { createPortal } from 'react-dom';

import $ from 'jquery';

import './Dialogue.scss';

export interface DialogueWithOK {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.OK;
	onClose: () => void;
	labels?: [string];
}

export interface DialogueWithOKCancel {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.OK_CANCEL;
	onClose: () => void;
	onOk: () => void;
	onCancel: () => void;
	labels?: [string, string];
}

export interface DialogueWithYesNoCancel {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.YES_NO_CANCEL;
	onClose: () => void;
	onYes: () => void;
	onNo: () => void;
	onCancel: () => void;
	labels?: [string, string, string];
}

export interface DialogueWithCustom {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.CUSTOM;
	onClose: () => void;
	labels: string[];
}

export interface DialogueWithoutButtons {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.NONE;
	onClose: () => void;
	labels?: never[];
}

export enum DialogueButtons {
	OK,
	OK_CANCEL,
	YES_NO_CANCEL,
	CUSTOM,
	NONE
}

export type DialogueProps =
	| DialogueWithOK
	| DialogueWithOKCancel
	| DialogueWithYesNoCancel
	| DialogueWithCustom
	| DialogueWithoutButtons;

interface DialogueState {
	open: boolean;
}

export default class Dialogue extends React.Component<DialogueProps, DialogueState> {
	public state = {
		open: false
	};

	private mainDiv = React.createRef<HTMLDivElement>();
	private cover = React.createRef<HTMLDivElement>();

	public componentDidMount() {
		if (this.mainDiv.current) {
			$(this.mainDiv.current).css({
				opacity: 0
			});
		}

		this.displayDialogue();
	}

	public componentDidUpdate() {
		this.displayDialogue();
	}

	public render() {
		return createPortal(
			<div
				className="cover"
				style={{
					display: this.state.open ? 'flex' : 'none'
				}}
				onClick={() => {
					this.props.onClose();
				}}
				ref={this.cover}
			>
				<div
					ref={this.mainDiv}
					className="alert-box"
					key="main-alert"
					onClick={e => !e.isPropagationStopped() && e.stopPropagation()}
				>
					{this.props.title ? <h2>{this.props.title}</h2> : null}
					<div className="content">{this.props.children}</div>
					{this.props.displayButtons === DialogueButtons.OK ? (
						<div className="closeButton">
							<button
								style={{
									float: 'right'
								}}
								className="primaryButton"
								id="ok"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									this.props.onClose();
								}}
							>
								{this.props.labels ? this.props.labels[0] : 'OK'}
							</button>
						</div>
					) : this.props.displayButtons === DialogueButtons.OK_CANCEL ? (
						<div className="closeButton">
							<button
								style={{
									float: 'right',
									marginLeft: 10
								}}
								className="primaryButton"
								id="cancel"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									this.props.onClose();
									if (this.props.displayButtons === DialogueButtons.OK_CANCEL) {
										this.props.onCancel();
									}
								}}
							>
								{this.props.labels ? this.props.labels[1] : 'Cancel'}
							</button>
							<button
								style={{
									float: 'right'
								}}
								className="primaryButton"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									this.props.onClose();
									if (this.props.displayButtons === DialogueButtons.OK_CANCEL) {
										this.props.onOk();
									}
								}}
							>
								{this.props.labels ? this.props.labels[0] : 'OK'}
							</button>
						</div>
					) : this.props.displayButtons === DialogueButtons.YES_NO_CANCEL ? (
						<div className="closeButton">
							<button
								style={{
									float: 'right',
									marginLeft: 10
								}}
								className="primaryButton"
								id="cancel"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									this.props.onClose();
									if (
										this.props.displayButtons === DialogueButtons.YES_NO_CANCEL
									) {
										this.props.onCancel();
									}
								}}
							>
								{this.props.labels ? this.props.labels[2] : 'Cancel'}
							</button>
							<button
								style={{
									float: 'right',
									marginLeft: 10
								}}
								className="primaryButton"
								id="no"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									this.props.onClose();
									if (
										this.props.displayButtons === DialogueButtons.YES_NO_CANCEL
									) {
										this.props.onNo();
									}
								}}
							>
								{this.props.labels ? this.props.labels[1] : 'No'}
							</button>
							<button
								style={{
									float: 'right'
								}}
								className="primaryButton"
								id="yes"
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.preventDefault();
									this.props.onClose();
									if (
										this.props.displayButtons === DialogueButtons.YES_NO_CANCEL
									) {
										this.props.onYes();
									}
								}}
							>
								{this.props.labels ? this.props.labels[0] : 'Yes'}
							</button>
						</div>
					) : null}
				</div>
			</div>,
			document.getElementById('dialogue-box') as HTMLElement
		);
	}

	private displayDialogue() {
		if (this.mainDiv.current) {
			const div = $(this.mainDiv.current);
			const cover = $(this.cover.current!);

			const firstInput = div.find('input[type=text]')[0];
			if (
				firstInput &&
				!firstInput.classList.contains('react-datepicker-ignore-onclickoutside')
			) {
				firstInput.focus();
			}

			if (this.props.open && !this.state.open) {
				div.animate(
					{
						opacity: 1
					},
					250,
					'swing'
				);
				cover.animate(
					{
						opacity: 1
					},
					250,
					'swing'
				);
				this.setState({
					open: true
				});
			} else if (!this.props.open && this.state.open) {
				div.animate(
					{
						opacity: 0
					},
					150,
					'swing',
					() => {
						this.setState({
							open: false
						});
					}
				);
				cover.animate(
					{
						opacity: 0
					},
					150,
					'swing'
				);
			}
		}
	}
}
