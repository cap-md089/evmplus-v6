import {
	FileUserAccessControlPermissions,
	FileUserAccessControlType
} from '../../../enums';
import Validator from '../Validator';

class FileUserControlListValidator extends Validator<FileUserControlList> {
	constructor() {
		super({
			type: {
				validator: Validator.StrictValue(FileUserAccessControlType.USER)
			},
			reference: {
				validator: Validator.MemberReference
			},
			permission: {
				validator: Validator.Enum(FileUserAccessControlPermissions)
			}
		});
	}
}

class FileTeamControlListValidator extends Validator<FileTeamControlList> {
	constructor() {
		super({
			type: {
				validator: Validator.StrictValue(FileUserAccessControlType.TEAM)
			},
			teamID: {
				validator: Validator.Number
			},
			permission: {
				validator: Validator.Enum(FileUserAccessControlPermissions)
			}
		})
	}
}

class FileAccountControlListValidator extends Validator<FileAccountControlList> {
	constructor() {
		super({
			type: {
				validator: Validator.StrictValue(FileUserAccessControlType.ACCOUNTMEMBER)
			},
			permission: {
				validator: Validator.Enum(FileUserAccessControlPermissions)
			}
		})
	}
}

class FileSignedInControlListValidator extends Validator<FileOtherControlList> {
	constructor() {
		super({
			type: {
				validator: Validator.StrictValue(FileUserAccessControlType.SIGNEDIN)
			},
			permission: {
				validator: Validator.Enum(FileUserAccessControlPermissions)
			}
		})
	}
}

class FileOtherControlListValidator extends Validator<FileOtherControlList> {
	constructor() {
		super({
			type: {
				validator: Validator.StrictValue(FileUserAccessControlType.OTHER)
			},
			permission: {
				validator: Validator.Enum(FileUserAccessControlPermissions)
			}
		})
	}
}

export default class FileObjectValidator extends Validator<
	EditableFileObjectProperties
> {
	constructor() {
		super({
			owner: {
				validator: Validator.MemberReference
			},
			comments: {
				validator: Validator.String
			},
			fileName: {
				validator: Validator.String
			},
			forDisplay: {
				validator: Validator.Boolean
			},
			forSlideshow: {
				validator: Validator.Boolean
			},
			permissions: {
				validator: Validator.ArrayOf(
					Validator.Or(
						new FileUserControlListValidator(),
						new FileTeamControlListValidator(),
						new FileAccountControlListValidator(),
						new FileSignedInControlListValidator(),
						new FileOtherControlListValidator(),
					)
				)
			}
		});
	}
}
