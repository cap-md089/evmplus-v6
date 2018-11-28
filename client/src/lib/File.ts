import {
	FileUserAccessControlPermissions,
	FileUserAccessControlType
} from '../enums';
import Account from './Account';
import APIInterface from './APIInterface';
import MemberBase from './MemberBase';
import urlFormat from './urlFormat';

class FileUploader {
	public progressListeners: Array<(progress: number) => void>;

	public finishListeners: Array<(file: FileInterface) => void>;

	public constructor(private file: File) {}

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
				return;
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
	public static Create(
		file: File,
		parent: FileInterface,
		member: MemberBase,
		account: Account
	) {
		const fileUploader = new FileUploader(file);

		setTimeout(async () => {
			const token = await FileInterface.getToken(account.id, member);

			const results = await fileUploader.uploadTo(
				parent,
				member,
				token,
				false
			);

			if (!results) {
				throw new Error('Could not upload file');
			}

			const fileInterface = new FileInterface(results, account!);

			fileInterface.moveTo(parent, member);

			fileUploader.finishListeners.forEach(l => l(fileInterface));
		});

		return fileUploader;
	}

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

		try {
			const results = await account.fetch(`/api/files/${id}`, {}, member);

			file = await results.json();
		} catch (e) {
			throw new Error('Could not find file');
		}

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

	public uploader: SigninReturn;

	public constructor(data: FullFileObject, public account: Account) {
		super(account.id);

		Object.assign(this, data);
	}

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

		if (member === null) {
			otherPermissions.forEach(
				perm =>
					// tslint:disable-next-line:no-bitwise
					(valid = valid || (perm.permission & permission) > 0)
			);

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

		if (member) {
			memberPermissions.forEach(
				perm =>
					(valid =
						valid ||
						// tslint:disable-next-line:no-bitwise
						((perm.permission & permission) > 0 &&
							member.matchesReference(perm.reference)))
			);
		}

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

	public getParent(member: MemberBase | null): Promise<FileInterface> {
		return this.id === 'root'
			? Promise.resolve(this)
			: FileInterface.Get(this.parentID, member, this.account);
	}

	public async addChild(
		member: MemberBase | null,
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

		await this.fetch(
			`/api/files/${this.id}/children`,
			{
				body: JSON.stringify({
					id: child
				}),
				method: 'POST'
			},
			member
		);
	}

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

		await this.fetch(
			`/api/files/${this.id}/children/${child}`,
			{
				method: 'DELETE'
			},
			member
		);
	}

	public async save(member: MemberBase) {
		await this.fetch(
			`/api/files/${this.id}`,
			{
				body: JSON.stringify(this.toRaw()),
				method: 'PUT'
			},
			member
		);
	}

	public async moveTo(
		target: FileInterface,
		member: MemberBase | null,
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

		await this.fetch(
			`/api/files/${this.parentID}/children/${this.id}`,
			{
				method: 'DELETE'
			},
			member
		);
		await this.fetch(
			`/api/files/${target.id}/children`,
			{
				method: 'POST',
				body: JSON.stringify({
					id: this.id
				})
			},
			member
		);
	}
}
