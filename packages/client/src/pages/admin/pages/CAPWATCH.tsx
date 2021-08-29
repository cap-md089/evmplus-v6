/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	CAPWATCHImportErrors,
	CAPWATCHImportUpdateType,
	Either,
	FileObject,
	hasPermission,
	Permissions,
	sockets,
} from 'common-lib';
import React, { useEffect, useReducer, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CAPWATCHImportUpdate } from '../../../../../common-lib/dist/typings/apis/member/capwatch';
import Button from '../../../components/Button';
import SimpleForm, { FileInput, Label } from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import { FetchAPIProps, withFetchApi } from '../../../globals';
import { RequiredMember } from '../pluggables/SiteAdmin';
import './CAPWATCH.css';

interface LoadingState {
	state: 'LOADING';
}

interface SelectingState {
	state: 'SELECTING';
	capwatchFileIDs: string[];
}

interface SelectedState {
	state: 'FILESELECTED';
	file: FileObject;
}

interface ImportingState {
	state: 'IMPORTING';
	file: FileObject;
	currentMessage: string;
	currentStep: number;
	recordCount: number;
	currentRecord: number;
	stepCount: number;
}

interface DoneImportingState {
	state: 'DONE';
	file: FileObject;
	fileDeleted: boolean;
	lastMessage: string;
}

interface ErrorState {
	state: 'ERROR';
	message: string;
}

interface MemberCancellation {
	state: 'MEMBERCANCELLED';
	capid: number;
	memberName: string;
}

type ImportState =
	| LoadingState
	| SelectingState
	| SelectedState
	| ImportingState
	| DoneImportingState
	| ErrorState
	| MemberCancellation;

const initialState: ImportState = {
	state: 'LOADING',
};

interface SelectFileAction {
	type: 'FileSelected';
	capwatchFileIDs: string[];
}

interface CAPWATCHFileSelectedAction {
	type: 'CAPWATCHSelected';
	file: FileObject;
}

interface CAPWATCHFileDeleted {
	type: 'CAPWATCHFileDeleted';
}

type Actions =
	| CAPWATCHImportUpdate
	| SelectFileAction
	| CAPWATCHFileSelectedAction
	| CAPWATCHFileDeleted;

const reducer = (state: ImportState, action: Actions): ImportState => {
	switch (action.type) {
		case CAPWATCHImportUpdateType.CAPWATCHFileDone:
			return state.state === 'IMPORTING'
				? {
						state: 'DONE',
						file: state.file,
						fileDeleted: false,
						lastMessage: state.currentMessage,
				  }
				: state;

		case CAPWATCHImportUpdateType.CAPWATCHFileDownloaded:
			return state.state === 'IMPORTING'
				? {
						...state,
						state: 'IMPORTING',
						currentMessage: 'CAPWATCH file uploaded',
						currentStep: action.currentStep,
				  }
				: state;

		case CAPWATCHImportUpdateType.FileImported:
			const status =
				action.error === CAPWATCHImportErrors.NONE ? 'imported' : 'failed import';

			return state.state === 'IMPORTING'
				? {
						...state,
						state: 'IMPORTING',
						currentMessage: `${action.file} ${status}`,
						currentStep: action.currentStep,
				  }
				: state;

		case CAPWATCHImportUpdateType.FileProgress:
			return state.state === 'IMPORTING'
				? {
						state: 'IMPORTING',
						currentMessage: state.currentMessage,
						currentStep: state.currentStep,
						file: state.file,
						stepCount: state.stepCount,
						currentRecord: action.currentRecord,
						recordCount: action.recordCount,
				  }
				: state;

		case CAPWATCHImportUpdateType.ProgressInitialization:
			return state.state === 'FILESELECTED'
				? {
						state: 'IMPORTING',
						currentMessage: 'Initializing...',
						currentStep: 0,
						file: state.file,
						stepCount: action.totalSteps,
						currentRecord: 1,
						recordCount: 1,
				  }
				: state;

		case CAPWATCHImportUpdateType.CancelledPermsIssue:
			return {
				state: 'MEMBERCANCELLED',
				capid: action.capid,
				memberName: action.memberName,
			};

		case 'Denied':
			return {
				state: 'ERROR',
				message: 'You do not have permission to perform this action',
			};

		case 'Error':
			return {
				state: 'ERROR',
				message: action.message,
			};

		case 'ImportReady':
			return state.state === 'LOADING' ? { state: 'SELECTING', capwatchFileIDs: [] } : state;

		case 'FileSelected':
			return state.state === 'SELECTING'
				? { state: 'SELECTING', capwatchFileIDs: action.capwatchFileIDs }
				: state;

		case 'CAPWATCHSelected':
			return state.state === 'SELECTING'
				? { state: 'FILESELECTED', file: action.file }
				: state;

		case 'CAPWATCHFileDeleted':
			return state.state === 'DONE'
				? {
						state: 'DONE',
						file: state.file,
						fileDeleted: true,
						lastMessage: state.lastMessage,
				  }
				: state;
	}
};

export const CAPWATCHUploadPage = (props: FetchAPIProps & RequiredMember): JSX.Element => {
	if (!hasPermission('DownloadCAPWATCH')(Permissions.DownloadCAPWATCH.YES)(props.member)) {
		return <div>You do not have permission to perform this action</div>;
	}

	const [state, dispatch] = useReducer(reducer, initialState);
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const conn = sockets.getClientNamespace('member:capwatch:importcapwatch', io);

		conn.on('result', (action: CAPWATCHImportUpdate) => {
			dispatch(action);
		});

		setSocket(conn);

		return () => void conn.disconnect();
	}, []);

	const onFormSubmit = async (vals: { capwatchFileIDs: string[] }): Promise<void> => {
		const fileResult = await props.fetchApi.files.files.get(
			{ id: vals.capwatchFileIDs[0] },
			{},
		);

		if (Either.isLeft(fileResult)) {
			return dispatch({
				type: 'Error',
				message: fileResult.value.message,
			});
		}

		dispatch({
			type: 'CAPWATCHSelected',
			file: fileResult.value,
		});

		socket?.emit('importfile', fileResult.value.id);
	};

	const deleteFile = (fileid: string) => async (): Promise<void> => {
		const fileDeleteResult = await props.fetchApi.files.files.delete({ fileid }, {});

		if (Either.isLeft(fileDeleteResult)) {
			return dispatch({
				type: 'Error',
				message: fileDeleteResult.value.message,
			});
		}

		dispatch({
			type: 'CAPWATCHFileDeleted',
		});
	};

	return state.state === 'LOADING' || state.state === 'FILESELECTED' ? (
		<Loader />
	) : state.state === 'ERROR' ? (
		<div>
			<h2>CAPWATCH import error</h2>
			{state.message}
		</div>
	) : state.state === 'SELECTING' ? (
		<div>
			<h2>Select a CAPWATCH file to import</h2>
			<SimpleForm<{ capwatchFileIDs: string[] }>
				values={state}
				validator={{
					capwatchFileIDs: val => val.length === 1,
				}}
				onChange={({ capwatchFileIDs }) =>
					dispatch({ type: 'FileSelected', capwatchFileIDs })
				}
				onSubmit={onFormSubmit}
			>
				<Label></Label>
				<FileInput
					name="capwatchFileIDs"
					single={true}
					account={props.account}
					member={props.member}
				/>
			</SimpleForm>
		</div>
	) : state.state === 'IMPORTING' ? (
		<div>
			<h2>Importing...</h2>
			<h3>{state.currentMessage}</h3>
			<div className="capwatch-progress-bar-container">
				<div
					className="capwatch-progress-bar"
					style={{
						width: `${
							(state.currentStep / state.stepCount +
								(1 / state.stepCount) *
									(state.recordCount === 0
										? 0
										: state.currentRecord / state.recordCount)) *
							100
						}%`,
					}}
				>
					{(
						(state.currentStep / state.stepCount +
							(1 / state.stepCount) *
								(state.recordCount === 0
									? 0
									: state.currentRecord / state.recordCount)) *
						100
					).toFixed(1)}
					%
				</div>
			</div>
		</div>
	) : state.state === 'MEMBERCANCELLED' ? (
		<div>
			<h2>Member Import Issue</h2>
			<h3>
				A transfer request is required; one of the members in your CAPWATCH file has been
				identified as being a part of another unit
			</h3>
			<p>
				It has been detected that you are trying to import member data for:{' '}
				{state.memberName} (CAPID: {state.capid}). Unfortunately, this is not an action that
				can be automatically performed at this time. Please email{' '}
				<a href="mailto:arioux@md.cap.gov">C/LtCol Andrew Rioux</a>
				to request that the member you are trying to transfer be transferred to your unit.
				When making the request, please be sure to include the name of the member, their CAP
				ID, and your unit you are transferring them to.
			</p>
		</div>
	) : (
		<div>
			<h2>Done importing!</h2>
			<h3>{state.lastMessage}</h3>
			{state.fileDeleted ? (
				<Button onClick={deleteFile(state.file.id)}>Delete CAPWATCH file?</Button>
			) : null}
		</div>
	);
};

export default withFetchApi(CAPWATCHUploadPage);
