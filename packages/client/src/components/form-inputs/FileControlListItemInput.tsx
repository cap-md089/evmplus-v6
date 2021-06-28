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
	FileAccountControlList,
	FileControlListItem,
	FileOtherControlList,
	FileSignedInControlList,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	RawTeamObject,
} from 'common-lib';
import * as React from 'react';
import { Component } from 'react';
import { FormBlock, Label, MemberSelector, TeamSelector } from '../forms/SimpleForm';
import EnumRadioButton from './EnumRadioButton';
import { InputProps } from './Input';

const newFileUserControlListEditItem = (
	permission: FileUserAccessControlPermissions,
): FileUserControlListEdit => ({
	type: FileUserAccessControlType.USER,
	reference: Maybe.none(),
	permission,
});

const newFileTeamControlListEditItem = (
	permission: FileUserAccessControlPermissions,
): FileTeamControlListEdit => ({
	type: FileUserAccessControlType.TEAM,
	teamID: Maybe.none(),
	permission,
});

const newFileAccountControlListEditItem = (
	permission: FileUserAccessControlPermissions,
): FileAccountControlList => ({
	type: FileUserAccessControlType.ACCOUNTMEMBER,
	permission,
});

const newFileSignedInControlListEditItem = (
	permission: FileUserAccessControlPermissions,
): FileSignedInControlList => ({
	type: FileUserAccessControlType.SIGNEDIN,
	permission,
});

const newOtherControlListEditItem = (
	permission: FileUserAccessControlPermissions,
): FileOtherControlList => ({
	type: FileUserAccessControlType.OTHER,
	permission,
});

const permissionsConstructor = {
	[FileUserAccessControlType.USER]: newFileUserControlListEditItem,
	[FileUserAccessControlType.TEAM]: newFileTeamControlListEditItem,
	[FileUserAccessControlType.ACCOUNTMEMBER]: newFileAccountControlListEditItem,
	[FileUserAccessControlType.SIGNEDIN]: newFileSignedInControlListEditItem,
	[FileUserAccessControlType.OTHER]: newOtherControlListEditItem,
};

export const isValid = (permissionEdit: FileControlListItemEdit): boolean =>
	permissionEdit.type === FileUserAccessControlType.USER
		? Maybe.isSome(permissionEdit.reference)
		: permissionEdit.type === FileUserAccessControlType.TEAM
		? Maybe.isSome(permissionEdit.teamID)
		: true;

export const parse = (permissionEdit: FileControlListItemEdit): MaybeObj<FileControlListItem> =>
	permissionEdit.type === FileUserAccessControlType.USER
		? Maybe.isSome(permissionEdit.reference)
			? Maybe.some({
					type: FileUserAccessControlType.USER,
					reference: permissionEdit.reference.value,
					permission: permissionEdit.permission,
			  })
			: Maybe.none()
		: permissionEdit.type === FileUserAccessControlType.TEAM
		? Maybe.isSome(permissionEdit.teamID)
			? Maybe.some({
					type: FileUserAccessControlType.TEAM,
					teamID: permissionEdit.teamID.value,
					permission: permissionEdit.permission,
			  })
			: Maybe.none()
		: Maybe.some(permissionEdit);

export interface FileUserControlListEdit {
	type: FileUserAccessControlType.USER;
	reference: MaybeObj<MemberReference>;
	permission: FileUserAccessControlPermissions;
}

export interface FileTeamControlListEdit {
	type: FileUserAccessControlType.TEAM;
	teamID: MaybeObj<number>;
	permission: FileUserAccessControlPermissions;
}

export type FileControlListItemEdit =
	| FileUserControlListEdit
	| FileTeamControlListEdit
	| FileAccountControlList
	| FileSignedInControlList
	| FileOtherControlList;

interface FileUserAccessControlPermissionsProps
	extends InputProps<FileUserAccessControlPermissions> {
	isFolder: boolean;
}

class FileUserAccessControlPermissionsInput extends Component<FileUserAccessControlPermissionsProps> {
	public constructor(props: FileUserAccessControlPermissionsProps) {
		super(props);
	}

	public render(): JSX.Element {
		const value = this.props.value ?? 0;

		return (
			<div className="input-formbox">
				<section>
					{this.props.hasError && this.props.errorMessage ? (
						<div style={{ paddingBottom: 5 }} className="text-error">
							{this.props.errorMessage}
						</div>
					) : null}
					<div className="checkboxDiv checkboxDivMult" key={0}>
						<input
							type="checkbox"
							// eslint-disable-next-line no-bitwise
							checked={(FileUserAccessControlPermissions.READ & value) !== 0}
							name={`${this.props.name}-read-${this.props.index ?? 0}`}
							onChange={this.onChange(FileUserAccessControlPermissions.READ)}
						/>
						<label htmlFor={`${this.props.name}-read-${this.props.index ?? 0}`} />
						<label htmlFor={`${this.props.name}-read-${this.props.index ?? 0}`}>
							{this.props.isFolder ? 'See items in folder' : 'Download file'}
						</label>
					</div>
					{/* <div className="checkboxDiv checkboxDivMult" key={0}>
						<input
							type="checkbox"
							// eslint-disable-next-line no-bitwise
							checked={(FileUserAccessControlPermissions.WRITE & value) !== 0}
							name={`${this.props.name}-write-${this.props.index}`}
						/>
						<label htmlFor={`${this.props.name}-write-${this.props.index}`} />
						<label htmlFor={`${this.props.name}-write-${this.props.index}`}>{label}</label>
					</div> */}
					<div className="checkboxDiv checkboxDivMult" key={0}>
						<input
							type="checkbox"
							// eslint-disable-next-line no-bitwise
							checked={(FileUserAccessControlPermissions.MODIFY & value) !== 0}
							name={`${this.props.name}-modify-${this.props.index ?? 0}`}
							onChange={this.onChange(FileUserAccessControlPermissions.MODIFY)}
						/>
						<label htmlFor={`${this.props.name}-modify-${this.props.index ?? 0}`} />
						<label htmlFor={`${this.props.name}-modify-${this.props.index ?? 0}`}>
							{this.props.isFolder
								? 'Upload files, delete folder, and change comments'
								: 'Delete file and change comments'}
						</label>
					</div>
				</section>
			</div>
		);
	}

	private onChange = (updater: FileUserAccessControlPermissions) => (
		ev: React.ChangeEvent<HTMLInputElement>,
	): void => {
		const checked = ev.currentTarget.checked;
		const value = this.props.value ?? 0;
		const newValue = checked
			? // eslint-disable-next-line no-bitwise
			  value | updater
			: // eslint-disable-next-line no-bitwise
			  value & ~updater;

		this.props.onChange?.(newValue);

		this.props.onUpdate?.({
			name: this.props.name,
			value: newValue,
		});
	};
}

const PermissionType = (
	name: string,
	index: number | undefined,
	permissions: FileUserAccessControlPermissions,
	onChange: (permissions: FileControlListItemEdit) => void,
): JSX.Element => (
	<EnumRadioButton<FileUserAccessControlType>
		name={`${name}-type-${index ?? 0}`}
		labels={['User', 'Team', 'Account member', 'EvMPlus user', 'Internet']}
		values={[
			FileUserAccessControlType.USER,
			FileUserAccessControlType.TEAM,
			FileUserAccessControlType.ACCOUNTMEMBER,
			FileUserAccessControlType.SIGNEDIN,
			FileUserAccessControlType.OTHER,
		]}
		onChange={type => {
			onChange(permissionsConstructor[type](permissions));
		}}
		defaultValue={FileUserAccessControlType.USER}
	/>
);

type FileUserControlListEditProps = Omit<InputProps<FileControlListItemEdit>, 'value'> & {
	value?: FileUserControlListEdit;
	isFolder: boolean;
	members: Member[];
};

const FileUserControlListEditInput = (props: FileUserControlListEditProps): JSX.Element => (
	<FormBlock name={props.name}>
		<Label>Group to apply permissions to</Label>
		{PermissionType(props.name, props.index, props.value?.permission ?? 0, val => {
			if (val.type !== FileUserAccessControlType.USER) {
				props.onChange?.(val);
			}
		})}

		<Label>Member for permissions</Label>
		<MemberSelector
			name={`${props.name}-member`}
			memberList={props.members}
			onChange={reference => {
				props.onChange?.({
					type: FileUserAccessControlType.USER,
					permission: props.value?.permission ?? 0,
					reference,
				});
			}}
		/>

		<Label>Permissions to apply</Label>
		<FileUserAccessControlPermissionsInput
			name={`${props.name}-permissions`}
			isFolder={props.isFolder}
			onChange={permission => {
				props.onChange?.({
					type: FileUserAccessControlType.USER,
					permission,
					reference: props.value?.reference ?? Maybe.none(),
				});
			}}
		/>
	</FormBlock>
);

type FileTeamControlListEditProps = Omit<InputProps<FileControlListItemEdit>, 'value'> & {
	value?: FileTeamControlListEdit;
	isFolder: boolean;
	teams: RawTeamObject[];
};

const FileTeamControlListEditInput = (props: FileTeamControlListEditProps): JSX.Element => (
	<FormBlock name={props.name}>
		<Label>Group to apply permissions to</Label>
		{PermissionType(props.name, props.index, props.value?.permission ?? 0, val => {
			if (val.type !== FileUserAccessControlType.TEAM) {
				props.onChange?.(val);
			}
		})}

		<Label>Team for permissions</Label>
		<TeamSelector
			name={`${props.name}-team`}
			teamList={props.teams}
			onChange={teamID => {
				props.onChange?.({
					type: FileUserAccessControlType.TEAM,
					permission: props.value?.permission ?? 0,
					teamID: Maybe.fromValue(teamID),
				});
			}}
		/>

		<Label>Permissions to apply</Label>
		<FileUserAccessControlPermissionsInput
			name={`${props.name}-permissions`}
			isFolder={props.isFolder}
			onChange={permission => {
				props.onChange?.({
					type: FileUserAccessControlType.TEAM,
					permission,
					teamID: props.value?.teamID ?? Maybe.none(),
				});
			}}
		/>
	</FormBlock>
);

type FileAccountControlListProps = Omit<InputProps<FileControlListItemEdit>, 'value'> & {
	value?: FileAccountControlList;
	isFolder: boolean;
};

const FileAccountControlListInput = (props: FileAccountControlListProps): JSX.Element => (
	<FormBlock name={props.name}>
		<Label>Group to apply permissions to</Label>
		{PermissionType(props.name, props.index, props.value?.permission ?? 0, val => {
			if (val.type !== FileUserAccessControlType.ACCOUNTMEMBER) {
				props.onChange?.(val);
			}
		})}

		<Label>Permissions to apply</Label>
		<FileUserAccessControlPermissionsInput
			name={`${props.name}-permissions`}
			isFolder={props.isFolder}
			onChange={permission => {
				props.onChange?.({
					type: FileUserAccessControlType.ACCOUNTMEMBER,
					permission,
				});
			}}
		/>
	</FormBlock>
);

type FileSignedInControlListProps = Omit<InputProps<FileControlListItemEdit>, 'value'> & {
	value?: FileSignedInControlList;
	isFolder: boolean;
};

const FileSignedInControlListInput = (props: FileSignedInControlListProps): JSX.Element => (
	<FormBlock name={props.name}>
		<Label>Group to apply permissions to</Label>
		{PermissionType(props.name, props.index, props.value?.permission ?? 0, val => {
			if (val.type !== FileUserAccessControlType.SIGNEDIN) {
				props.onChange?.(val);
			}
		})}

		<Label>Permissions to apply</Label>
		<FileUserAccessControlPermissionsInput
			name={`${props.name}-permissions`}
			isFolder={props.isFolder}
			onChange={permission => {
				props.onChange?.({
					type: FileUserAccessControlType.SIGNEDIN,
					permission,
				});
			}}
		/>
	</FormBlock>
);

type FileOtherControlListProps = Omit<InputProps<FileControlListItemEdit>, 'value'> & {
	value?: FileOtherControlList;
	isFolder: boolean;
};

const FileOtherControlListInput = (props: FileOtherControlListProps): JSX.Element => (
	<FormBlock name={props.name}>
		<Label>Group to apply permissions to</Label>
		{PermissionType(props.name, props.index, props.value?.permission ?? 0, val => {
			if (val.type !== FileUserAccessControlType.OTHER) {
				props.onChange?.(val);
			}
		})}

		<Label>Permissions to apply</Label>
		<FileUserAccessControlPermissionsInput
			name={`${props.name}-permissions`}
			isFolder={props.isFolder}
			onChange={permission => {
				props.onChange?.({
					type: FileUserAccessControlType.OTHER,
					permission,
				});
			}}
		/>
	</FormBlock>
);

export interface FileControlListItemInputProps extends InputProps<FileControlListItemEdit> {
	isFolder: boolean;
	members: Member[];
	teams: RawTeamObject[];
}

export const FileControlListItemInput = (props: FileControlListItemInputProps): JSX.Element =>
	props.value?.type === FileUserAccessControlType.USER
		? FileUserControlListEditInput({
				name: props.name,
				isFolder: props.isFolder,
				onChange: props.onChange,
				members: props.members,
				value: props.value,
		  })
		: props.value?.type === FileUserAccessControlType.TEAM
		? FileTeamControlListEditInput({
				name: props.name,
				isFolder: props.isFolder,
				onChange: props.onChange,
				teams: props.teams,
				value: props.value,
		  })
		: props.value?.type === FileUserAccessControlType.ACCOUNTMEMBER
		? FileAccountControlListInput({
				name: props.name,
				isFolder: props.isFolder,
				onChange: props.onChange,
				value: props.value,
		  })
		: props.value?.type === FileUserAccessControlType.SIGNEDIN
		? FileSignedInControlListInput({
				name: props.name,
				isFolder: props.isFolder,
				onChange: props.onChange,
				value: props.value,
		  })
		: props.value?.type === FileUserAccessControlType.OTHER
		? FileOtherControlListInput({
				name: props.name,
				isFolder: props.isFolder,
				onChange: props.onChange,
				value: props.value,
		  })
		: FileOtherControlListInput({
				name: props.name,
				isFolder: props.isFolder,
				onChange: props.onChange,
				value: permissionsConstructor.Public(0),
		  });
