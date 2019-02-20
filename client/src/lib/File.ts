import {
	FileUserAccessControlPermissions,
	FileUserAccessControlType
} from 'common-lib/index';
import Account from './Account';
import APIInterface from './APIInterface';
import MemberBase from './MemberBase';
import urlFormat from './urlFormat';
import { FullFileObject, FileControlListItem, MemberReference, MemberObject, FileTeamControlList, FileUserControlList } from 'common-lib';

/**
 * Simple private class used to handle uploading the files
 */
class FileUploader {
	public progressListeners: Array<(progress: number) => void> = [];

	public finishListeners: Array<(file: FileInterface) => void> = [];

	public constructor(private file: File) {}

	/**
	 * Uploads the file the class was constructed with to the location
	 * specified
	 *
	 * @param target The folder to upload the file to
	 * @param member The member that is uploading the file
	 * @param token The token required for all non-GET tasks
	 * @param errOnInvalidPermissions Throw an error or silently fail
	 * 		if the member doesn't have the required permissions
	 */
	public uploadTo(
		target: FileInterface,
		member: MemberBase,
		token: string,
		errOnInvalidPermissions = false
	) {
		if (
			!target.hasPermission(
				member,
				FileUserAccessControlPermissions.MODIFY
			)
		) {
			if (errOnInvalidPermissions) {
				throw new Error('Invalid permissions');
			} else {
				return new Promise<undefined>(res => res());
			}
		}

		const fd = new FormData();
		fd.append('file', this.file, this.file.name);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', urlFormat('api', 'files', 'upload'));

		xhr.setRequestHeader('authorization', member.sessionID);
		xhr.setRequestHeader('token', token);

		xhr.upload.addEventListener('progress', ev => {
			if (ev.lengthComputable) {
				this.progressListeners.forEach(l => l(ev.loaded / ev.total));
			}
		});

		xhr.upload.addEventListener('loadend', () => {
			this.progressListeners.forEach(l => l(1));
		});

		return new Promise<FullFileObject>((res, rej) => {
			xhr.addEventListener('readystatechange', function(evt: Event) {
				if (this.readyState === 4) {
					const resp = JSON.parse(
						this.responseText
					) as FullFileObject;

					res(resp);
				}
			});

			xhr.send(fd);
		});
	}
}

export default class FileInterface extends APIInterface<FullFileObject>
	implements FullFileObject {
	/**
	 * Uploads a file and moves it to its requested place
	 *
	 * Also returns a file uploader class that allows for listening to progress
	 * and finish events
	 *
	 * @param file The file to upload
	 * @param parent The folder to upload the file to
	 * @param member The member taking responsibility for uploading the file
	 * @param account The Account that is responsible for the file
	 */
	public static Create(
		file: File,
		parent: FileInterface,
		member: MemberBase,
		account: Account
	) {
		const fileUploader = new FileUploader(file);

		FileInterface.getToken(account.id, member)
			.then(async token => {
				const results = await fileUploader.uploadTo(parent, member, token, false);

				if (!results) {
					throw new Error('Could not upload file');
				}

				const fileInterface = new FileInterface(results, account!);

				await fileInterface.moveTo(parent, member);

				fileUploader.finishListeners.forEach(l => l(fileInterface));
			});

		return fileUploader;
	}

	/**
	 * Creates a folder in the `root` folder
	 *
	 * To create a folder in another folder, create a folder
	 * and call the moveTo method on the returned file
	 *
	 * A folder is nothing more than a file that has a different MIME type
	 * It can technically have contents, but here the folder is created without
	 * any contents
	 *
	 * @param name The name of the folder
	 * @param member The member creating the folder
	 * @param account The account responsible for the folder
	 */
	public static async CreateFolder(
		name: string,
		member: MemberBase,
		account: Account
	) {
		const token = await APIInterface.getToken(account.id, member);

		const results = await account.fetch(
			`/api/files/create`,
			{
				method: 'POST',
				body: JSON.stringify({
					name,
					token
				})
			},
			member
		);

		const json = (await results.json()) as FullFileObject;

		return new FileInterface(json, account);
	}

	/**
	 * Gets the file metadata for the requested file ID
	 *
	 * @param id The ID of the file/folder to get
	 * @param member The member getting the file, checking for permissions
	 * @param account The Account of the file
	 */
	public static async Get(
		id: string,
		member: MemberBase | null | undefined,
		account: Account
	) {
		let file: FullFileObject;

		// if (
		// 	id !== 'root' &&
		// 	!id.match(/^([a-z0-9])-/)
		// ) {
		// 	throw new Error('Invalid File ID');
		// }

		const results = await account.fetch(`/api/files/${id}`, {}, member);

		file = await results.json();

		return new FileInterface(file, account);
	}

	public id: string = '';

	public comments: string = '';

	public contentType: string = '';

	public created: number = 0;

	public fileChildren: string[] = [];

	public fileName: string = '';

	public forDisplay: boolean = false;

	public forSlideshow: boolean = false;

	public readonly kind = 'drive#file';

	public permissions: FileControlListItem[] = [];

	public parentID: string = '';

	public owner: MemberReference;

	public folderPath: Array<{ id: string; name: string }> = [];

	public uploader: MemberObject;

	public constructor(data: FullFileObject, public account: Account) {
		super(account.id);

		this.id = data.id;
		this.comments = data.comments;
		this.created = data.created;
		this.fileChildren = data.fileChildren;
		this.fileName = data.fileName;
		this.forDisplay = data.forDisplay;
		this.forSlideshow = data.forSlideshow;
		this.permissions = data.permissions;
		this.parentID = data.parentID;
		this.folderPath = data.folderPath;
		this.owner = data.owner;
		this.uploader = data.uploader;
	}

	/**
	 * Converts this class to a transferable object
	 */
	public toRaw(): FullFileObject {
		return {
			accountID: this.accountID,
			comments: this.comments,
			contentType: this.contentType,
			created: this.created,
			fileChildren: this.fileChildren,
			fileName: this.fileName,
			forDisplay: this.forDisplay,
			forSlideshow: this.forSlideshow,
			id: this.id,
			kind: 'drive#file',
			permissions: this.permissions,
			parentID: this.parentID,
			owner: this.owner,
			folderPath: this.folderPath,
			uploader: this.uploader
		};
	}

	/**
	 * Checks if a member has requested permission for this file
	 *
	 * @param member The member to check
	 * @param permission The permission to check for
	 */
	public hasPermission(
		member: MemberBase | null,
		permission: FileUserAccessControlPermissions
	) {
		if (member) {
			if (member.hasPermission('FileManagement')) {
				return true;
			}

			if (member.matchesReference(this.owner)) {
				return true;
			}
		}

		const otherPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.OTHER
		);
		const signedInPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.SIGNEDIN
		);
		const accountPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.ACCOUNTMEMBER
		);
		const teamPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.TEAM
		) as FileTeamControlList[];
		const memberPermissions = this.permissions.filter(
			perm => perm.type === FileUserAccessControlType.USER
		) as FileUserControlList[];

		let valid = false;

		otherPermissions.forEach(
			perm =>
				// tslint:disable-next-line:no-bitwise
				(valid = valid || (perm.permission & permission) > 0)
		);

		if (member === null || valid) {
			return valid;
		}

		signedInPermissions.forEach(
			perm =>
				// tslint:disable-next-line:no-bitwise
				(valid = valid || (perm.permission & permission) > 0)
		);

		if (valid) {
			return true;
		}

		accountPermissions.forEach(
			perm =>
				// tslint:disable-next-line:no-bitwise
				(valid = valid || (perm.permission & permission) > 0)
		);

		if (valid) {
			return true;
		}

		memberPermissions.forEach(
			perm =>
				(valid =
					valid ||
					// tslint:disable-next-line:no-bitwise
					((perm.permission & permission) > 0 &&
						member.matchesReference(perm.reference)))
		);

		if (valid) {
			return true;
		}

		if (teamPermissions.length === 0) {
			return false;
		}

		member.teamIDs.forEach(i =>
			teamPermissions.forEach(
				perm =>
					(valid =
						valid ||
						(perm.teamID === i &&
							// tslint:disable-next-line:no-bitwise
							(perm.permission & permission) > 0))
			)
		);

		return valid;
	}

	/**
	 * Get the file/folder that has this file as a child
	 *
	 * If the current file or folder is the root folder, this will return a promise
	 * resolving to itself as it has no parent
	 *
	 * @param member The member to use to get the file info of the parent file
	 */
	public getParent(member: MemberBase | null): Promise<FileInterface> {
		return this.id === 'root'
			? Promise.resolve(this)
			: FileInterface.Get(this.parentID, member, this.account);
	}

	/**
	 * Adds the file given as a child to the current file/folder
	 *
	 * @param member The member that needs to have permission to do so
	 * @param child The child file to add
	 * @param errOnInvalidPermissions If true, this function will throw an error if
	 * 		the member doesn't have the proper permissions. Otherwise, it will
	 * 		silently fail
	 */
	public async addChild(
		member: MemberBase,
		child: FileInterface | string,
		errOnInvalidPermissions = false
	) {
		if (
			!this.hasPermission(member, FileUserAccessControlPermissions.MODIFY)
		) {
			if (errOnInvalidPermissions) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		if (child instanceof FileInterface) {
			child = child.id;
		}

		const token = await this.getToken(member);

		await this.fetch(
			`/api/files/${this.id}/children`,
			{
				body: JSON.stringify({
					id: child,
					token
				}),
				method: 'POST'
			},
			member
		);
	}

	/**
	 *
	 * @param member The member that needs to have permission to remove the file
	 * @param child The child to remove
	 * @param errOnInvalidPermissions If true, this function will throw an error if
	 * 		the member doesn't have the proper permissions. Otherwise, it will
	 * 		silently fail
	 */
	public async removeChild(
		member: MemberBase,
		child: FileInterface | string,
		errOnInvalidPermissions = false
	) {
		if (
			!this.hasPermission(member, FileUserAccessControlPermissions.MODIFY)
		) {
			if (errOnInvalidPermissions) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		if (child instanceof FileInterface) {
			child = child.id;
		}

		const token = await this.getToken(member);

		await this.fetch(
			`/api/files/${this.id}/children/${child}`,
			{
				method: 'DELETE',
				body: JSON.stringify({
					token
				})
			},
			member
		);
	}

	/**
	 * Saves the current file
	 *
	 * @param member The member to save the file
	 */
	public async save(member: MemberBase) {
		const token = await this.getToken(member);

		const result = await this.fetch(
			`/api/files/${this.id}`,
			{
				body: JSON.stringify({
					...this.toRaw(),
					token
				}),
				method: 'PUT'
			},
			member
		);

		return result.status;
	}

	/**
	 * Moves the file to the specified location
	 *
	 * This is an operation that requires a save to be made, as it cannot do so without
	 * risking saving the wrong data
	 *
	 * @param target The place to move the file to
	 * @param member The member moving the file
	 * @param errOnInvalidPermissions If true, this function will throw an error if
	 * 		the member doesn't have the proper permissions. Otherwise, it will
	 * 		silently fail
	 */
	public async moveTo(
		target: FileInterface,
		member: MemberBase,
		errOnInvalidPermissions = false
	) {
		if (
			!target.hasPermission(
				member,
				FileUserAccessControlPermissions.MODIFY
			)
		) {
			if (errOnInvalidPermissions) {
				throw new Error('Invalid permissions');
			} else {
				return;
			}
		}

		const token = await this.getToken(member);

		const moveResult = await this.fetch(
			`/api/files/${target.id}/children`,
			{
				method: 'POST',
				body: JSON.stringify({
					id: this.id,
					token
				})
			},
			member
		);

		this.parentID = target.id;

		return moveResult.status;
	}

	/**
	 * Deletes the current file
	 *
	 * @param member The member that will delete the ifle
	 * @param errOnInvalidPermissions If true, this function will throw an error if
	 * 		the member doesn't have the proper permissions. Otherwise, it will
	 * 		silently fail
	 */
	public async delete(member: MemberBase, errOnInvalidPermissions = false) {
		const token = await this.getToken(member);

		const result = await this.fetch(
			`/api/files/${this.id}`,
			{
				method: 'DELETE',
				body: JSON.stringify({
					token
				})
			},
			member
		);

		return result.status;
	}
}
