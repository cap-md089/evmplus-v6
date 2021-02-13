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
	areMembersTheSame,
	complement,
	EditableFileObjectProperties,
	FileControlListItem,
	FileTeamControlList,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FileUserControlList,
	getFullMemberName,
	Member,
	RawFileObject,
	RawTeamObject,
	RegistryValues,
	stringifyMemberReference,
	toReference,
} from 'common-lib';
import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import Autocomplete from 'react-autocomplete';
import Button from '../Button';
import Dialogue, { DialogueButtons } from './Dialogue';
import './FilePermissionsDialogue.css';

interface FilePermissionsDialogueProps<T extends RawFileObject> {
	file: T;
	handleFile: (file: T) => void;
	handleCancel: () => void;
	members: Member[];
	teams: RawTeamObject[];
	registry: RegistryValues;
	open: boolean;
}

const getName = (item: Member | RawTeamObject): string =>
	'type' in item ? getFullMemberName(item) : item.name;

const highlightedStyle: React.CSSProperties = {
	backgroundColor: '#4040e0',
	padding: 4,
	boxSizing: 'border-box',
};

const unhighlightedStyle: React.CSSProperties = {
	padding: 4,
	boxSizing: 'border-box',
};

const inputProps = {
	className: 'group-input',
};

const renderItem = (item: any, isHighlighted: boolean) => (
	<div key={getName(item)} style={isHighlighted ? highlightedStyle : unhighlightedStyle}>
		{getName(item)}
	</div>
);

interface PermissionSelectProps {
	permission: FileUserAccessControlPermissions | null;
	handleNewPermission: (perm: FileUserAccessControlPermissions | null) => void;
}

const PermissionSelect = ({ permission, handleNewPermission }: PermissionSelectProps) => (
	<select
		onChange={useCallback(
			e =>
				e.target.value === 'null'
					? handleNewPermission(null)
					: handleNewPermission(parseInt(e.target.value, 10)),
			[handleNewPermission],
		)}
	>
		<option selected={permission === null} value={'null'}>
			No permissions
		</option>
		<option
			selected={permission === FileUserAccessControlPermissions.READ}
			value={FileUserAccessControlPermissions.READ.toString()}
		>
			View
		</option>
		<option
			selected={
				// tslint:disable-next-line: no-bitwise
				permission !== null && (permission & FileUserAccessControlPermissions.MODIFY) !== 0
			}
			value={FileUserAccessControlPermissions.MODIFY.toString()}
		>
			View and modify
		</option>
	</select>
);

interface PermissionSelectWithRemoveProps {
	permission: FileUserAccessControlPermissions;
	handleNewPermission: (perm: FileUserAccessControlPermissions) => void;
	handleRemovePermission: () => void;
}

const PermissionSelectWithRemove = ({
	permission,
	handleNewPermission,
	handleRemovePermission,
}: PermissionSelectWithRemoveProps) => (
	<select
		onChange={useCallback(
			e =>
				e.target.value === '_remove-permission'
					? handleRemovePermission()
					: handleNewPermission(parseInt(e.target.value, 10)),
			[handleRemovePermission, handleNewPermission],
		)}
	>
		<option
			selected={permission === FileUserAccessControlPermissions.READ}
			value={FileUserAccessControlPermissions.READ.toString()}
		>
			View
		</option>
		<option
			// tslint:disable-next-line: no-bitwise
			selected={(permission & FileUserAccessControlPermissions.MODIFY) !== 0}
			value={FileUserAccessControlPermissions.MODIFY.toString()}
		>
			View and modify
		</option>
		<option disabled={true}>──────────</option>
		<option value="_remove-permission">Remove</option>
	</select>
);

const arePermissionsTheSameAndPersonOrGroup = (
	perm1: FileUserControlList | FileTeamControlList,
) => (perm2: FileControlListItem) =>
	(perm1.type === FileUserAccessControlType.USER &&
		perm2.type === FileUserAccessControlType.USER &&
		areMembersTheSame(perm1.reference)(perm2.reference)) ||
	(perm1.type === FileUserAccessControlType.TEAM &&
		perm2.type === FileUserAccessControlType.TEAM &&
		perm1.teamID === perm2.teamID);

const updateFilePermissions = (perm: FileUserControlList | FileTeamControlList) => <
	T extends EditableFileObjectProperties
>(
	file: T,
): T => ({
	...file,

	permissions: file.permissions.map(perm2 =>
		arePermissionsTheSameAndPersonOrGroup(perm)(perm2) ? perm : perm2,
	),
});

const removeFilePermission = (perm: FileUserControlList | FileTeamControlList) => <
	T extends EditableFileObjectProperties
>(
	file: T,
): T => ({
	...file,

	permissions: file.permissions.filter(complement(arePermissionsTheSameAndPersonOrGroup(perm))),
});

const isPersonOrGroupPerm = (
	perm: FileControlListItem,
): perm is FileUserControlList | FileTeamControlList =>
	perm.type === FileUserAccessControlType.TEAM || perm.type === FileUserAccessControlType.USER;

const PersonPerm = <T extends EditableFileObjectProperties>({
	members,
	setFile,
	perm,
}: {
	members: Member[];
	setFile: React.Dispatch<React.SetStateAction<T>>;
	perm: FileUserControlList;
}) => (
	<li className="permission member-permission">
		<div className="permission-holder-name">
			{members.filter(areMembersTheSame(perm.reference)).map(getName)[0] ??
				stringifyMemberReference(perm.reference)}
		</div>

		<div className="permission-perm">
			<PermissionSelectWithRemove
				permission={perm.permission}
				handleRemovePermission={useCallback(() => setFile(removeFilePermission(perm)), [
					setFile,
					perm,
				])}
				handleNewPermission={useCallback(
					newPerm => setFile(updateFilePermissions({ ...perm, permission: newPerm })),
					[setFile, perm],
				)}
			/>
		</div>
	</li>
);

const TeamPerm = <T extends EditableFileObjectProperties>({
	teams,
	setFile,
	perm,
}: {
	teams: RawTeamObject[];
	setFile: React.Dispatch<React.SetStateAction<T>>;
	perm: FileTeamControlList;
}) => (
	<li className="permission team-permission">
		<div className="permission-holder-name">
			{teams.filter(team => team.id === perm.teamID).map(getName) ?? '<Unknown team>'}
		</div>

		<div className="permission-perm">
			<PermissionSelectWithRemove
				permission={perm.permission}
				handleRemovePermission={useCallback(() => setFile(removeFilePermission(perm)), [
					setFile,
					perm,
				])}
				handleNewPermission={useCallback(
					newPerm => setFile(updateFilePermissions({ ...perm, permission: newPerm })),
					[setFile, perm],
				)}
			/>
		</div>
	</li>
);

const renderPersonOrGroupPerm = <T extends EditableFileObjectProperties>(
	members: Member[],
	teams: RawTeamObject[],
	setFile: React.Dispatch<React.SetStateAction<T>>,
) => (perm: FileUserControlList | FileTeamControlList) =>
	perm.type === FileUserAccessControlType.USER ? (
		<PersonPerm
			key={
				members.filter(areMembersTheSame(perm.reference)).map(getName)[0] ??
				stringifyMemberReference(perm.reference)
			}
			members={members}
			setFile={setFile}
			perm={perm}
		/>
	) : (
		<TeamPerm
			key={teams.filter(team => team.id === perm.teamID).map(getName)[0] ?? '<Unknown team>'}
			teams={teams}
			setFile={setFile}
			perm={perm}
		/>
	);

const permissionForType = (permType: FileUserAccessControlType) => <T extends RawFileObject>(
	currentFile: T,
) => currentFile.permissions.find(item => item.type === permType)?.permission ?? null;

const handleStaticPermissions = (permType: FileUserAccessControlType) => <T extends RawFileObject>(
	currentFile: T,
	setCurrentFile: React.Dispatch<React.SetStateAction<T>>,
) => (permission: FileUserAccessControlPermissions | null) => {
	permission === null
		? setCurrentFile({
				...currentFile,
				permissions: currentFile.permissions.filter(item => item.type !== permType),
		  })
		: !!currentFile.permissions.find(item => item.type === permType)
		? setCurrentFile({
				...currentFile,
				permissions: currentFile.permissions.map(perm =>
					perm.type === permType
						? {
								type: permType,
								permission,
						  }
						: perm,
				),
		  })
		: setCurrentFile({
				...currentFile,
				permissions: [
					...currentFile.permissions,
					{
						type: permType,
						permission,
					},
				],
		  });
};

export const FilePermissionsDialogue = <T extends RawFileObject>({
	handleFile,
	handleCancel: handleCancelFn,
	file,
	members,
	open,
	teams,
	registry,
}: FilePermissionsDialogueProps<T>) => {
	const [currentFile, setCurrentFile] = useState(file);
	const [search, setSearch] = useState('');

	const handleCancel = useCallback(() => {
		setCurrentFile(file);
		handleCancelFn();
	}, [handleCancelFn, setCurrentFile, file]);
	const onOk = useCallback(() => handleFile(currentFile), [currentFile, handleFile]);

	const linkSpan = useRef<HTMLSpanElement>(null);
	const handleLinkSpanClick = useCallback(() => {
		if (linkSpan.current) {
			try {
				const range = document.createRange();
				range.selectNode(linkSpan.current);
				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(range);
				}
			} catch (e) {
				// Probably an old browser
				// (Looking at you, IE)
				return;
			}
		}
	}, [linkSpan]);
	const handleCopyLinkClick = useCallback(() => {
		if (linkSpan.current) {
			try {
				const range = document.createRange();
				range.selectNode(linkSpan.current);
				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(range);
					document.execCommand('copy');
					selection.removeAllRanges();
				}
			} catch (e) {
				// Probably an old browser
				// (Looking at you, IE)
				return;
			}
		}
	}, [linkSpan]);

	const searchableItems = useMemo(() => [...members, ...teams], [members, teams]);

	const onAddPersonOrGroup = useCallback(
		(personOrGroup: Member | RawTeamObject) => {
			setCurrentFile({
				...currentFile,

				permissions: [
					...currentFile.permissions,
					'type' in personOrGroup
						? {
								type: FileUserAccessControlType.USER,
								permission: FileUserAccessControlPermissions.READ,
								reference: toReference(personOrGroup),
						  }
						: {
								type: FileUserAccessControlType.TEAM,
								permission: FileUserAccessControlPermissions.READ,
								teamID: personOrGroup.id,
						  },
				],
			});
		},
		[currentFile],
	);

	const shouldItemRender = useCallback(
		(item: Member | RawTeamObject, input: string) =>
			!('type' in item
				? currentFile.permissions.find(
						perm =>
							perm.type === FileUserAccessControlType.USER &&
							areMembersTheSame(item)(perm.reference),
				  )
				: currentFile.permissions.find(
						perm =>
							perm.type === FileUserAccessControlType.TEAM && perm.teamID === item.id,
				  )) &&
			getName(item)
				.toLowerCase()
				.includes(input.toLowerCase()),
		[currentFile],
	);
	const onChange = useCallback((_, value) => setSearch(value), [setSearch]);
	const onSelect = useCallback((_, item) => onAddPersonOrGroup(item), [onAddPersonOrGroup]);

	// eslint-disable-next-line
	const handleAccountMemberChange = useCallback(
		handleStaticPermissions(FileUserAccessControlType.ACCOUNTMEMBER)(
			currentFile,
			setCurrentFile,
		),
		[currentFile, setCurrentFile],
	);
	// eslint-disable-next-line
	const handleSignedInMemberChange = useCallback(
		handleStaticPermissions(FileUserAccessControlType.SIGNEDIN)(currentFile, setCurrentFile),
		[currentFile, setCurrentFile],
	);
	// eslint-disable-next-line
	const handleOtherChange = useCallback(
		handleStaticPermissions(FileUserAccessControlType.OTHER)(currentFile, setCurrentFile),
		[currentFile, setCurrentFile],
	);

	const link =
		file.contentType === 'application/folder'
			? `https://${registry.accountID}.${process.env.REACT_APP_HOST_NAME}/drive/${file.id}`
			: `https://${registry.accountID}.${process.env.REACT_APP_HOST_NAME}/api/files/${file.id}/download`;

	return (
		<Dialogue
			open={open}
			displayButtons={DialogueButtons.OK_CANCEL}
			onCancel={handleCancel}
			onOk={onOk}
			onClose={handleCancel}
			title="Share file"
			className="file-permissions dialogue-box"
		>
			<div className="link-info">
				<div>
					<span ref={linkSpan} onClick={handleLinkSpanClick}>
						{link}
					</span>
				</div>
				<div>
					<Button
						buttonType="none"
						onClick={handleCopyLinkClick}
						className="copy-link-button"
					>
						Copy link
					</Button>
				</div>
			</div>

			<div className="group-permissions">
				<h2>Share with people and teams</h2>
				<Autocomplete
					autoHighlight={true}
					items={searchableItems}
					value={search}
					getItemValue={getName}
					renderItem={renderItem}
					onChange={onChange}
					onSelect={onSelect}
					shouldItemRender={shouldItemRender}
					wrapperProps={inputProps}
					inputProps={{ placeholder: 'Add people and teams' }}
				/>

				<ul>
					<li className="permission member-permission">
						<div className="permission-holder-name">
							{members.filter(areMembersTheSame(file.owner)).map(getName)[0] ??
								stringifyMemberReference(file.owner)}
						</div>

						<div className="permission-perm perm-owner">Owner</div>
					</li>

					{currentFile.permissions
						.filter(isPersonOrGroupPerm)
						.filter(
							perm =>
								perm.type === FileUserAccessControlType.TEAM ||
								!areMembersTheSame(perm.reference)(file.owner),
						)
						.map(renderPersonOrGroupPerm(members, teams, setCurrentFile))}
				</ul>
			</div>

			<div className="static-permissions">
				<h2>Global permissions</h2>

				<div className="permission">
					<div className="permission-holder-name">Members in {registry.Website.Name}</div>

					<div className="permission-perm">
						<PermissionSelect
							permission={permissionForType(FileUserAccessControlType.ACCOUNTMEMBER)(
								currentFile,
							)}
							handleNewPermission={handleAccountMemberChange}
						/>
					</div>
				</div>

				<div className="permission">
					<div className="permission-holder-name">Members signed in</div>

					<div className="permission-perm">
						<PermissionSelect
							permission={permissionForType(FileUserAccessControlType.SIGNEDIN)(
								currentFile,
							)}
							handleNewPermission={handleSignedInMemberChange}
						/>
					</div>
				</div>

				<div className="permission">
					<div className="permission-holder-name">Public access</div>

					<div className="permission-perm">
						<PermissionSelect
							permission={permissionForType(FileUserAccessControlType.OTHER)(
								currentFile,
							)}
							handleNewPermission={handleOtherChange}
						/>
					</div>
				</div>
			</div>
		</Dialogue>
	);
};

export default FilePermissionsDialogue;
