import { ExtraMemberInformation, MemberAccessLevel, MemberReference, MemberType } from 'common-lib';
import { NotificationCauseType, NotificationDataType } from 'common-lib/index';
import MemberBase from '../../../lib/Members';
import { collectResults } from '../../../lib/MySQLUtil';
import MemberNotification from '../../../lib/notifications/MemberNotification';
import { asyncErrorHandler } from '../../../lib/Util';
import Validator, { MemberValidatedRequest } from '../../../lib/validator/Validator';

interface PermissionItem {
	member: MemberReference;
	accessLevel: MemberAccessLevel;
}

interface PermissionsList {
	newRoles: PermissionItem[];
}

const permissionValidator = new Validator<PermissionItem>({
	accessLevel: {
		validator: Validator.OneOfStrict<MemberAccessLevel>('Admin', 'Manager', 'Staff')
	},
	member: {
		validator: Validator.MemberReference
	}
});

export const permissionsValidator = new Validator<PermissionsList>({
	newRoles: {
		validator: Validator.ArrayOf(permissionValidator)
	}
});

const refFromInfo = (info: ExtraMemberInformation): MemberReference =>
	({
		type: info.type as Exclude<MemberType, 'Null'>,
		id: info.id
	} as MemberReference);

const level = (l: MemberAccessLevel) => ['Member', 'Staff', 'Manager', 'Admin'].indexOf(l);

export default asyncErrorHandler(async (req: MemberValidatedRequest<PermissionsList>, res) => {
	const extraMemberInformationCollection = req.mysqlx.getCollection<ExtraMemberInformation>(
		'ExtraMemberInformation'
	);

	/**
	 * This just sanitizes user inputs, makes sure there are no duplicates and makes sure each item
	 * is as high as possible
	 */
	const newRoles: PermissionItem[] = [];
	for (let i = 0; i < req.body.newRoles.length; i++) {
		let found = false;
		for (let j = 0; j < newRoles.length; j++) {
			if (
				MemberBase.AreMemberReferencesTheSame(
					newRoles[j].member,
					req.body.newRoles[i].member
				)
			) {
				if (level(newRoles[j].accessLevel) > level(req.body.newRoles[i].accessLevel)) {
					newRoles[j].accessLevel = req.body.newRoles[i].accessLevel;
				}
				found = true;
			}
		}

		if (!found && req.body.newRoles[i].member.type !== 'Null') {
			newRoles.push(req.body.newRoles[i]);
		}
	}

	const oldRoles = await collectResults(
		extraMemberInformationCollection
			.find(
				'accessLevel = "Staff" OR accessLevel = "Manager" OR accessLevel = "Admin" AND accountID = :accountID'
			)
			.bind('accountID', req.account.id)
	);

	/**
	 * Checks to see whether someone is promoted or demoted
	 */
	const promotionRoles: PermissionItem[] = [];
	const demotionRoles: PermissionItem[] = [];

	for (let i = oldRoles.length - 1; i >= 0; i--) {
		let found = false;

		for (let j = newRoles.length - 1; j >= 0; j--) {
			if (
				MemberBase.AreMemberReferencesTheSame(newRoles[j].member, refFromInfo(oldRoles[i]))
			) {
				if (level(newRoles[j].accessLevel) < level(oldRoles[i].accessLevel)) {
					// They now have a lower level
					demotionRoles.push(newRoles[j]);
					found = true;
				} else if (level(newRoles[j].accessLevel) > level(oldRoles[i].accessLevel)) {
					// They now have a higher level
					promotionRoles.push(newRoles[j]);
					found = true;
				} else {
					// do nothing
					found = true;
				}
			}
		}

		if (!found) {
			demotionRoles.push({
				accessLevel: 'Member',
				member: refFromInfo(oldRoles[i])
			});
		}
	}

	const promoteesOldRole: MemberAccessLevel[] = [];
	const demoteesOldRole: MemberAccessLevel[] = [];
	const promotees = [];
	const demotees = [];

	// Promote everyone that needs to be promoted
	for (let i = 0; i < promotionRoles.length; i++) {
		const member = await MemberBase.ResolveReference(
			promotionRoles[i].member,
			req.account,
			req.mysqlx,
			true
		);

		promoteesOldRole.push(member.accessLevel);

		member.setAccessLevel(promotionRoles[i].accessLevel);

		await member.saveExtraMemberInformation(req.mysqlx, req.account);

		promotees.push(member);
	}

	for (let j = 0; j < demotionRoles.length; j++) {
		const member = await MemberBase.ResolveReference(
			demotionRoles[j].member,
			req.account,
			req.mysqlx,
			true
		);

		demoteesOldRole.push(member.accessLevel);

		member.setAccessLevel(demotionRoles[j].accessLevel);

		await member.saveExtraMemberInformation(req.mysqlx, req.account);

		demotees.push(member);
	}

	// Don't wait the user down with sending notifications
	res.status(204);
	res.end();

	for (let i = 0; i < promotees.length; i++) {
		await MemberNotification.CreateNotification(
			"You've been assigned a higher permission level",
			promotees[i].getReference(),
			{
				type: NotificationCauseType.MEMBER,
				from: req.member.getReference()
			},
			{
				type: NotificationDataType.PERMISSIONCHANGE,

				newLevel: promotees[i].accessLevel,
				oldLevel: promoteesOldRole[i]
			},
			req.account,
			req.mysqlx,
			req.member
		);
	}

	for (let j = 0; j < demotees.length; j++) {
		await MemberNotification.CreateNotification(
			"You've been lower a higher permission level",
			demotees[j].getReference(),
			{
				type: NotificationCauseType.MEMBER,
				from: req.member.getReference()
			},
			{
				type: NotificationDataType.PERMISSIONCHANGE,

				newLevel: demotees[j].accessLevel,
				oldLevel: demoteesOldRole[j]
			},
			req.account,
			req.mysqlx,
			req.member
		);
	}
});
