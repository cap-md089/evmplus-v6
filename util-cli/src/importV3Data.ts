// import { Collection, getSession, Schema } from '@mysql/xdevapi';
// import {
// 	AttendanceStatus,
// 	CustomAttendanceFieldEntryType,
// 	CustomAttendanceFieldText,
// 	EchelonEventNumber,
// 	EventStatus,
// 	ExternalPointOfContact,
// 	ExtraMemberInformation,
// 	FileUserAccessControlPermissions,
// 	FileUserAccessControlType,
// 	InternalPointOfContact,
// 	MemberReference,
// 	MemberUpdateEventEmitter,
// 	NHQ,
// 	OtherMultCheckboxReturn,
// 	PointOfContactType,
// 	RadioReturnWithOther,
// 	RadioReturnWithoutOtherSelected,
// 	RawEventObject,
// 	RawFileObject,
// 	RawTeamObject,
// 	RegistryValues,
// 	SimpleMultCheckboxReturn,
// 	StoredMemberPermissions,
// 	TeamPublicity,
// 	UserAccountInformation,
// } from 'common-lib';
// import { EventEmitter } from 'events';
// import { writeFileSync } from 'fs';
// import * as mysql from 'mysql';
// import { join } from 'path';
// import conf from './conf';

// // tslint:disable-next-line: no-namespace
// namespace V3 {
// 	export interface OldAccount {
// 		'UnitID': number;
// 		'AccountID': string;
// 		'Unit Name': string;
// 		'MainOrg': number;
// 		'Paid': number;
// 		'Echelon': number;
// 		'Expires': number;
// 		'PaidEventLimit': number;
// 		'UnpaidEventLimit': number;
// 		'Comments': string;
// 		'EmbedLink': string;
// 		'MainID': string;
// 		'WingID': string;
// 		'ShareLink': string;
// 		'InitialPassword': string;
// 		'AdminID': number;
// 	}

// 	export interface Attendance {
// 		Timestamp: number;
// 		EventID: number;
// 		CAPID: number;
// 		MemberRankName: string;
// 		Comments: string;
// 		Status: string;
// 		PlanToUseCAPTransportation: number;
// 		AccountID: string;
// 		Requirements: string | null;
// 		SummaryEmailSent: number;
// 		Confirmed: number | null;
// 	}

// 	export interface EventInformation {
// 		TimeModified: string;
// 		Created: number;
// 		AccountID: string;
// 		EventNumber: number;
// 		EventName: string;
// 		MeetDateTime: number;
// 		MeetLocation: string;
// 		StartDateTime: number;
// 		EventLocation: string;
// 		EndDateTime: number;
// 		PickupDateTime: number;
// 		PickupLocation: string;
// 		TransportationProvided: number;
// 		TransportationDescription: string;
// 		Uniform: string;
// 		DesiredNumParticipants: number;
// 		RegistrationDeadline: number;
// 		RegistrationInformation: string;
// 		ParticipationFeeDue: number;
// 		ParticipationFee: number;
// 		LodgingArrangements: string;
// 		Meals: string;
// 		Activity: string;
// 		HighAdventureDescription: string;
// 		RequiredEquipment: string;
// 		EventWebsite: string;
// 		RequiredForms: string;
// 		Comments: string;
// 		AcceptSignUps: number;
// 		SignUpDenyMessage: string;
// 		PublishToWingCalendar: number;
// 		ShowUpcoming: number;
// 		GroupEventNumber: string;
// 		Complete: number;
// 		Administration: string;
// 		Status: string;
// 		Debrief: string;
// 		CAPPOC1ID: number;
// 		CAPPOC1Name: string;
// 		CAPPOC1Phone: string;
// 		CAPPOC1Email: string;
// 		CAPPOC1ReceiveEventUpdates: number;
// 		CAPPOC1ReceiveSignUpUpdates: number;
// 		CAPPOC2ID: number;
// 		CAPPOC2Name: string;
// 		CAPPOC2Phone: string;
// 		CAPPOC2Email: string;
// 		CAPPOC2ReceiveEventUpdates: number;
// 		CAPPOC2ReceiveSignUpUpdates: number;
// 		AdditionalEmailAddresses: string;
// 		ExtPOCName: string;
// 		ExtPOCPhone: string;
// 		ExtPOCEmail: string;
// 		ExtPOCReceiveEventUpdates: number;
// 		Author: number;
// 		PartTime: number;
// 		TeamID: number;
// 		SourceEventNumber: number;
// 		SourceAccountID: string;
// 		IsSpecial: number;
// 		PrivateAttendance: number;
// 	}

// 	export interface FileData {
// 		ID: string;
// 		UploadI: number;
// 		UploadN: string;
// 		Name: string;
// 		Comments: string;
// 		ContentType: string;
// 		Created: number;
// 		MemberOnly: number;
// 		IsPhoto: number;
// 		ForSlideshow: number;
// 		Data: string;
// 		MD5: string;
// 		AccountID: string;
// 	}

// 	export interface FileEventAssignments {
// 		FileID: string;
// 		EID: number;
// 		AccountID: string;
// 	}

// 	export interface Flights {
// 		CAPID: number;
// 		AccountID: string;
// 		Flight: string;
// 		Mentor: number;
// 	}

// 	export interface GoogleCalendarIDs {
// 		AccountID: string;
// 		CalendarType: string;
// 		CalendarID: string;
// 		InitialPassword: string;
// 	}

// 	export interface Notifications {
// 		id: number;
// 		Acknowledged: number;
// 		CAPID: number;
// 		timestamp: number;
// 		message: string;
// 		remarks: string;
// 		deleted: number;
// 		AccountID: string;
// 		FileID: string | null;
// 	}

// 	export interface Registry {
// 		AccountID: string;
// 		RegistryKey: string;
// 		Value: string;
// 		Type: string;
// 	}

// 	export interface SpecialAttendance {
// 		Timestamp: number;
// 		EventID: number;
// 		CAPID: number;
// 		MemberRankName: string;
// 		Comments: string;
// 		Status: string;
// 		PlanToUseCAPTransportation: number;
// 		AccountID: string;
// 		Requirements: string;
// 		SummaryEmailSent: number;
// 		GeoLoc: string;
// 		DutyPreference: string;
// 		Confirmed: number;
// 		EmailAddress: string;
// 		PhoneNumber: string;
// 		Uniform: string;
// 	}

// 	export interface TaskRecipients {
// 		TaskID: number;
// 		CAPID: number;
// 		Done: string;
// 		DoneComments: string;
// 	}

// 	export interface Tasks {
// 		Name: string;
// 		Tasker: number;
// 		ID: number;
// 		Description: string;
// 		AccountID: string;
// 		Done: number;
// 	}

// 	export interface OldTeam {
// 		TeamID: number;
// 		AccountID: string;
// 		TeamName: string;
// 		TeamDescription: string;
// 		TeamLead: number;
// 		TeamCoach: number;
// 		TeamMentor: number;
// 	}

// 	export interface TeamMembers {
// 		TeamID: number;
// 		CAPID: number;
// 		Role: string;
// 		AccountID: string;
// 	}

// 	export interface UserAccessLevels {
// 		capid: number;
// 		AccessLevel: string;
// 		memname: string;
// 		memrank: string;
// 		AccountID: string;
// 	}

// 	export interface UserAccountInfo {
// 		UserID: string;
// 		CAPID: number;
// 		Status: number;
// 	}

// 	export interface UserPasswordData {
// 		UserID: string;
// 		PasswordHash: string;
// 		PasswordSalt: string;
// 		PasswordIterationCount: number;
// 		HistoryIndex: string;
// 		AddTime: number;
// 	}

// 	// tslint:disable-next-line:class-name
// 	export interface Data_Member {
// 		Timestamp: number;
// 		DataSource: string;
// 		CAPID: number;
// 		NameLast: string;
// 		NameFirst: string;
// 		NameMiddle: string;
// 		NameSuffix: string;
// 		Gender: string;
// 		DOB: number;
// 		Profession: string;
// 		EducationLevel: string;
// 		Citizen: string;
// 		ORGID: number;
// 		Wing: string;
// 		UNIT: string;
// 		Rank: string;
// 		Joined: number;
// 		Expiration: number;
// 		OrgJoined: number;
// 		UsrID: string;
// 		DateMod: number;
// 		LSCode: string;
// 		Type: string;
// 		RankDate: number;
// 		Region: string;
// 		MbrSt: string;
// 		PicStatus: string;
// 		CdtWaiver: string;
// 	}

// 	// tslint:disable-next-line:class-name
// 	export interface Data_MbrContact {
// 		CAPID: number;
// 		Type: string;
// 		Priority: string;
// 		Contact: string;
// 		UsrID: string;
// 		DateMod: number;
// 		DoNotContact: number;
// 		ContactName: string;
// 		ORGID: number;
// 	}
// }

// function parseCheckboxValue(
// 	dbValue: string | null,
// 	labels: string[],
// 	other: true
// ): OtherMultCheckboxReturn;
// function parseCheckboxValue(
// 	dbValue: string | null,
// 	labels: string[],
// 	other: false
// ): SimpleMultCheckboxReturn;

// function parseCheckboxValue(
// 	dbValue: string | null,
// 	labels: string[],
// 	other: boolean
// ): OtherMultCheckboxReturn | SimpleMultCheckboxReturn {
// 	const dbValues = (dbValue || '').split(', ');

// 	const values = labels.map(label => dbValues.indexOf(label) > -1);

// 	const dbValuesWithoutOther = dbValues.filter(value => labels.indexOf(value) === -1);

// 	const otherValue = dbValuesWithoutOther.join(', ');

// 	if (other) {
// 		return {
// 			values,
// 			labels,
// 			otherSelected: !!otherValue,
// 			otherValue,
// 		};
// 	} else {
// 		return {
// 			values,
// 			labels,
// 		};
// 	}
// }

// function parseRadioValue<E extends number>(
// 	dbValue: string | null,
// 	labels: string[],
// 	defaultValue: E,
// 	other: true
// ): RadioReturnWithOther<E>;
// function parseRadioValue<E extends number>(
// 	dbValue: string | null,
// 	labels: string[],
// 	defaultValue: E,
// 	other: false
// ): E;

// function parseRadioValue<E extends number>(
// 	dbValue: string | null,
// 	labels: string[],
// 	defaultValue: E,
// 	other: boolean
// ): E | RadioReturnWithOther<E> {
// 	const estimatedIndex = labels.indexOf(dbValue || '');

// 	if (other) {
// 		return estimatedIndex === -1
// 			? {
// 					otherValue: dbValue || '',
// 					otherValueSelected: true,
// 					labels,
// 			  }
// 			: {
// 					otherValueSelected: false,
// 					selection: estimatedIndex as E,
// 					labels,
// 			  };
// 	} else {
// 		const index = estimatedIndex === -1 ? defaultValue : estimatedIndex;

// 		return index as E;
// 	}
// }

// const getOrCreate = async <T>(schema: Schema, name: string): Promise<Collection<T>> => {
// 	try {
// 		return schema.getCollection(name);
// 	} catch (e) {
// 		return schema.createCollection(name, {});
// 	}
// };

// /* Tables map (V3 -> V4) */

// /* Ignored */
// // Absentee (data fluctuates)
// // Blog
// // Blog Photos
// // BrowserAnalytics
// // CAPWATCH_Download_Log
// // CAPWATCH_Units
// // CadetDutyPositions
// // Data_*
// // Del_*
// // DutyPosition
// // ErrorMessages
// // EventINodes
// // FilePageAssignments
// // FilePhotoAssignments
// // FileSessions (data fluctuates)
// // Flights_Temp
// // Import_*
// // InfoQuery_RegionMembers
// // AccountPasswords (view)
// // MAR-Member.txt
// // MbrContact
// // MbrContactNew
// // Member
// // MemberExpContact
// // MemberExpired
// // MemberNew
// // MemberSessions -> Sessions (data fluctuates)
// // Member_Tmp
// // SalesEventTemplates
// // ScanAddSessions -> Sessions (data fluctuates)
// // SignUpQueue
// // SpecialES
// // SupplyNotifications
// // TDutyPositions
// // UserAccountToken -> UserAccountTokens (data fluctuates)

// /* To import */
// // Accounts -> Accounts
// // Attendance -> Attendance
// // EventInformation -> Events
// // FileData -> Files, disk
// // FileEventAssignments -> Events
// // Flights -> ExtraMemberInformation
// // GoogleCalendarIDs -> Accounts
// // Notifications -> Notifications
// // Registry -> Registry
// // SpecialAttendance -> Attendance
// // TaskRecipients -> Tasks
// // Tasks -> Tasks
// // Team -> Teams
// // TeamMembers -> Teams
// // UserAccessLevels -> UserPermissions
// // UserAccountInfo -> UserAccountInfo
// // UserPasswordData -> UserAccountInfo

// // FileMemberAssignments -> N/A

// enum RunFlag {
// 	RUN,
// 	NORUN,
// }

// (async () => {
// 	const { user, password, host, port } = conf.database.connection;

// 	const mysqlxSession = await getSession({
// 		user,
// 		password,
// 		host,
// 		port,
// 	});
// 	const targetSchema = mysqlxSession.getSchema(conf.database.connection.database);

// 	const mysqlConnection = mysql.createConnection({
// 		port: 33389,
// 		host: 'md089.capunit.com',
// 		user,
// 		password,
// 		database: 'EventManagement',
// 	});

// 	await new Promise((res, rej) => {
// 		mysqlConnection.connect(err => {
// 			if (err) {
// 				rej(err);
// 				return;
// 			}
// 			console.log('Connected to MySQL');
// 			res();
// 		});
// 	});

// 	await Promise.all([
// 		getOrCreate(targetSchema, 'Accounts'),
// 		getOrCreate(targetSchema, 'Attendance'),
// 		getOrCreate(targetSchema, 'Audits'),
// 		getOrCreate(targetSchema, 'Errors'),
// 		getOrCreate(targetSchema, 'Events'),
// 		getOrCreate(targetSchema, 'ExtraMemberInformation'),
// 		getOrCreate(targetSchema, 'Files'),
// 		getOrCreate(targetSchema, 'MemberSessions'),
// 		getOrCreate(targetSchema, 'NHQ_CadetActivities'),
// 		getOrCreate(targetSchema, 'NHQ_CadetDutyPosition'),
// 		getOrCreate(targetSchema, 'NHQ_DutyPosition'),
// 		getOrCreate(targetSchema, 'NHQ_MbrContact'),
// 		getOrCreate(targetSchema, 'NHQ_Member'),
// 		getOrCreate(targetSchema, 'NHQ_OFlight'),
// 		getOrCreate(targetSchema, 'NHQ_Organization'),
// 		getOrCreate(targetSchema, 'Notifications'),
// 		getOrCreate(targetSchema, 'PasswordResetTokens'),
// 		getOrCreate(targetSchema, 'ProspectiveMembers'),
// 		getOrCreate(targetSchema, 'Registry'),
// 		getOrCreate(targetSchema, 'Sessions'),
// 		getOrCreate(targetSchema, 'SigninTokens'),
// 		getOrCreate(targetSchema, 'Tasks'),
// 		getOrCreate(targetSchema, 'Teams'),
// 		getOrCreate(targetSchema, 'Tokens'),
// 		getOrCreate(targetSchema, 'UserAccountInfo'),
// 		getOrCreate(targetSchema, 'UserAccountTokens'),
// 		getOrCreate(targetSchema, 'UserPermissions'),
// 	]);

// 	const accounts = await moveAccounts(mysqlConnection, targetSchema);
// 	await movePermissions(mysqlConnection, targetSchema, RunFlag.NORUN);
// 	await moveRegistry(mysqlConnection, targetSchema, RunFlag.NORUN);
// 	await moveUsers(mysqlConnection, targetSchema, RunFlag.NORUN);
// 	await moveExtraMemberInfo(mysqlConnection, targetSchema, RunFlag.NORUN);
// 	await moveTeams(mysqlConnection, targetSchema, accounts, RunFlag.NORUN);
// 	await moveFiles(mysqlConnection, targetSchema, RunFlag.NORUN);
// 	await moveMemberData(mysqlConnection, targetSchema, RunFlag.NORUN);
// 	await moveEvents(mysqlConnection, targetSchema, accounts, RunFlag.RUN, RunFlag.NORUN);

// 	return 0;
// })()
// 	.then(process.exit)
// 	.catch(e => {
// 		console.error(e);
// 		process.exit(1);
// 	});

// async function clearCollection(collection: Collection) {
// 	await collection.remove('true').execute();
// }

// async function moveAccounts(from: mysql.Connection, to: Schema): Promise<Account[]> {
// 	console.log('Moving accounts...');

// 	const accountCollection = await getOrCreate<RawAccountObject>(to, 'Accounts');

// 	await clearCollection(accountCollection);

// 	const [oldAccounts, oldGoogleIDs] = (await Promise.all([
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM Accounts;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM GoogleCalendarIDs;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 	])) as [V3.OldAccount[], V3.GoogleCalendarIDs[]];

// 	const oldAccountsAsRawAccountObjects: { [key: string]: RawAccountObject } = {};

// 	for (const oldAccount of oldAccounts) {
// 		if (!oldAccountsAsRawAccountObjects[oldAccount.AccountID]) {
// 			oldAccountsAsRawAccountObjects[oldAccount.AccountID] = {
// 				adminIDs: [{ type: 'CAPNHQMember', id: oldAccount.AdminID }],
// 				aliases: [],
// 				comments: oldAccount.Comments,
// 				echelon: oldAccount.Echelon === 1,
// 				expires: 0,
// 				id: oldAccount.AccountID,
// 				mainCalendarID: oldGoogleIDs.find(
// 					googleIDs =>
// 						googleIDs.AccountID === oldAccount.AccountID &&
// 						googleIDs.CalendarType === 'Main'
// 				)?.CalendarID!,
// 				mainOrg: oldAccount.MainOrg === 1 ? oldAccount.UnitID : 0,
// 				orgIDs: [oldAccount.UnitID],
// 				paid: false,
// 				paidEventLimit: 5000,
// 				serviceAccount: none<string>(),
// 				shareLink: oldGoogleIDs.find(
// 					googleIDs =>
// 						googleIDs.AccountID === oldAccount.AccountID &&
// 						googleIDs.CalendarType === 'Share'
// 				)?.CalendarID!,
// 				unpaidEventLimit: 5000,
// 				wingCalendarID: oldGoogleIDs.find(
// 					googleIDs =>
// 						googleIDs.AccountID === oldAccount.AccountID &&
// 						googleIDs.CalendarType === 'Wing'
// 				)?.CalendarID!,
// 				discordServer: { hasValue: false },
// 			};
// 		} else {
// 			const obj = oldAccountsAsRawAccountObjects[oldAccount.AccountID];
// 			obj.orgIDs.push(oldAccount.UnitID);
// 			obj.mainOrg =
// 				oldAccount.MainOrg === 1
// 					? oldAccount.UnitID
// 					: oldAccount.UnitID !== 0
// 					? oldAccount.UnitID
// 					: obj.mainOrg;
// 		}
// 	}

// 	const newAccounts: Account[] = [];

// 	for (const accountID in oldAccountsAsRawAccountObjects) {
// 		if (oldAccountsAsRawAccountObjects.hasOwnProperty(accountID)) {
// 			const obj = oldAccountsAsRawAccountObjects[accountID];

// 			const newAccount = await Account.Create(obj, to);

// 			console.log(`Created account ${newAccount.id}`);

// 			newAccounts.push(newAccount);
// 		}
// 	}

// 	console.log('Moved accounts.');

// 	return newAccounts;
// }

// async function moveEvents(
// 	from: mysql.Connection,
// 	to: Schema,
// 	accounts: Account[],
// 	run: RunFlag,
// 	runCopy: RunFlag
// ) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	console.log('Moving events...');

// 	const attendanceCollection = await getOrCreate<RawAttendanceDBRecord>(to, 'Attendance');
// 	const eventCollection = await getOrCreate<RawEventObject>(to, 'Events');

// 	if (runCopy === RunFlag.RUN) {
// 		await Promise.all([
// 			clearCollection(eventCollection),
// 			clearCollection(attendanceCollection),
// 		]);

// 		for (const account of accounts) {
// 			console.log(`Deleting events for ${account.id}...`);
// 			await deleteAllGoogleCalendarEvents(account);
// 			console.log(`Deleted events for ${account.id}.`);
// 		}
// 	} else {
// 		await clearCollection(attendanceCollection);
// 	}

// 	const [oldEvents, oldAttendance, oldSpecialAttendance, fileAssignments] = (await Promise.all([
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM EventInformation;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM Attendance;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM SpecialAttendance;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM FileEventAssignments;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 	])) as [
// 		V3.EventInformation[],
// 		V3.Attendance[],
// 		V3.SpecialAttendance[],
// 		V3.FileEventAssignments[]
// 	];

// 	const echelonLabels = ['Not Required', 'To Be Applied For', 'Applied For'];

// 	const transformEvent = (rec: V3.EventInformation) => ({
// 		acceptSignups: !!rec.AcceptSignUps,
// 		activity: parseCheckboxValue(
// 			rec.Activity,
// 			[
// 				'Squadron Meeting',
// 				'Classroom/Tour/Light',
// 				'Backcountry',
// 				'Flying',
// 				'Physically Rigorous',
// 				'Recurring Meeting',
// 			],
// 			true
// 		),
// 		administrationComments: rec.Comments,
// 		author: {
// 			type: 'CAPNHQMember',
// 			id: rec.Author,
// 		},
// 		comments: rec.Comments,
// 		complete: rec.Complete === 1,
// 		customAttendanceFields: rec.IsSpecial
// 			? [
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What is your geographic location?',
// 						preFill: '',
// 						displayToMember: true,
// 						allowMemberToModify: true,
// 					} as CustomAttendanceFieldText,
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What are your top 3 desired duty/training positions?',
// 						preFill: '',
// 						displayToMember: true,
// 						allowMemberToModify: true,
// 					} as CustomAttendanceFieldText,
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What is your email address?',
// 						preFill: '',
// 						displayToMember: true,
// 						allowMemberToModify: true,
// 					} as CustomAttendanceFieldText,
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What is your phone number?',
// 						preFill: '',
// 						displayToMember: true,
// 						allowMemberToModify: true,
// 					} as CustomAttendanceFieldText,
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What uniform are you planning to wear?',
// 						preFill: '',
// 						displayToMember: true,
// 						allowMemberToModify: true,
// 					} as CustomAttendanceFieldText,
// 			  ]
// 			: [],
// 		debrief: [],
// 		desiredNumberOfParticipants: rec.DesiredNumParticipants,
// 		endDateTime: rec.EndDateTime * 1000,
// 		eventWebsite: rec.EventWebsite,
// 		fileIDs: fileAssignments
// 			.filter(
// 				assignment =>
// 					assignment.EID === rec.EventNumber && assignment.AccountID === rec.AccountID
// 			)
// 			.map(v => v.FileID),
// 		groupEventNumber: parseRadioValue(
// 			rec.GroupEventNumber,
// 			echelonLabels,
// 			EchelonEventNumber.NOT_REQUIRED,
// 			true
// 		),
// 		highAdventureDescription: rec.HighAdventureDescription,
// 		limitSignupsToTeam: false,
// 		location: rec.EventLocation,
// 		lodgingArrangments: parseCheckboxValue(
// 			rec.LodgingArrangements,
// 			['Hotel or Individual Room', 'Open Bay Building', 'Large Tent', 'Individual Tent'],
// 			true
// 		),
// 		mealsDescription: parseCheckboxValue(
// 			rec.Meals,
// 			['No Meals Provided', 'Meals Provided', 'Bring Own Food', 'Bring Money'],
// 			true
// 		),
// 		meetDateTime: rec.MeetDateTime * 1000,
// 		meetLocation: rec.MeetLocation,
// 		name: rec.EventName,
// 		participationFee:
// 			rec.ParticipationFee !== 0 && rec.ParticipationFeeDue !== 0
// 				? {
// 						feeAmount: rec.ParticipationFee,
// 						feeDue: rec.ParticipationFeeDue * 1000,
// 				  }
// 				: null,
// 		pickupDateTime: rec.PickupDateTime * 1000,
// 		pickupLocation: rec.PickupLocation,
// 		pointsOfContact: [
// 			...(rec.CAPPOC1ID !== 0
// 				? [
// 						{
// 							type: PointOfContactType.INTERNAL,
// 							email: rec.CAPPOC1Email,
// 							phone: rec.CAPPOC1Phone,
// 							receiveUpdates:
// 								rec.CAPPOC1ReceiveEventUpdates === 1 ||
// 								rec.CAPPOC1ReceiveSignUpUpdates,
// 							receiveRoster: false,
// 							receiveEventUpdates: rec.CAPPOC1ReceiveEventUpdates === 1,
// 							receiveSignUpUpdates: rec.CAPPOC1ReceiveSignUpUpdates === 1,
// 							memberReference: {
// 								type: 'CAPNHQMember',
// 								id: rec.CAPPOC1ID,
// 							},
// 						} as InternalPointOfContact,
// 				  ]
// 				: []),
// 			...(rec.CAPPOC2ID !== 0
// 				? [
// 						{
// 							type: PointOfContactType.INTERNAL,
// 							email: rec.CAPPOC2Email,
// 							phone: rec.CAPPOC2Phone,
// 							receiveUpdates:
// 								rec.CAPPOC2ReceiveEventUpdates === 1 ||
// 								rec.CAPPOC2ReceiveSignUpUpdates,
// 							receiveRoster: false,
// 							receiveEventUpdates: rec.CAPPOC2ReceiveEventUpdates === 1,
// 							receiveSignUpUpdates: rec.CAPPOC2ReceiveSignUpUpdates === 1,
// 							memberReference: {
// 								type: 'CAPNHQMember',
// 								id: rec.CAPPOC2ID,
// 							},
// 						} as InternalPointOfContact,
// 				  ]
// 				: []),
// 			...(rec.ExtPOCName !== ''
// 				? [
// 						{
// 							type: PointOfContactType.EXTERNAL,
// 							email: rec.ExtPOCEmail,
// 							phone: rec.ExtPOCPhone,
// 							receiveUpdates: rec.ExtPOCReceiveEventUpdates === 1,
// 							receiveRoster: false,
// 							receiveEventUpdates: rec.ExtPOCReceiveEventUpdates === 1,
// 							receiveSignUpUpdates: false,
// 							name: rec.ExtPOCName,
// 						} as ExternalPointOfContact,
// 				  ]
// 				: []),
// 		],
// 		privateAttendance: rec.PrivateAttendance === 1,
// 		publishToWingCalendar: false,
// 		regionEventNumber: {
// 			labels: echelonLabels,
// 			otherValueSelected: false,
// 			selection: EchelonEventNumber.NOT_REQUIRED,
// 		} as RadioReturnWithoutOtherSelected<EchelonEventNumber>,
// 		wingEventNumber: {
// 			labels: echelonLabels,
// 			otherValueSelected: false,
// 			selection: EchelonEventNumber.NOT_REQUIRED,
// 		} as RadioReturnWithoutOtherSelected<EchelonEventNumber>,
// 		registration:
// 			rec.RegistrationDeadline !== 0 && rec.RegistrationInformation !== ''
// 				? {
// 						deadline: rec.RegistrationDeadline * 1000,
// 						information: rec.RegistrationInformation,
// 				  }
// 				: null,
// 		requiredEquipment: rec.RequiredEquipment !== '' ? [rec.RequiredEquipment] : [],
// 		requiredForms: parseCheckboxValue(
// 			rec.RequiredForms,
// 			[
// 				'CAP Identification Card',
// 				'CAPF31 Application for CAP Encampment Or Special Activity',
// 				'CAPF 60-80 Civil Air Patrol Cadet Activity Permission Slip',
// 				'CAPF 101 Specialty Qualification Card',
// 				'CAPF 160 CAP Member Health History Form',
// 				'CAPF 161 Emergency Information',
// 				'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication',
// 			],
// 			true
// 		),
// 		showUpcoming: rec.ShowUpcoming === 1,
// 		signUpDenyMessage: rec.SignUpDenyMessage,
// 		signUpPartTime: false,
// 		startDateTime: rec.StartDateTime * 1000,
// 		status: parseRadioValue<EventStatus>(
// 			rec.Status,
// 			['Draft', 'Tentative', 'Confirmed', 'Complete', 'Cancelled', 'Information Only'],
// 			EventStatus.TENTATIVE,
// 			false
// 		),
// 		teamID: rec.TeamID !== 0 ? rec.TeamID : null,
// 		transportationDescription: rec.TransportationDescription,
// 		transportationProvided: rec.TransportationProvided === 1,
// 		uniform: parseCheckboxValue(
// 			rec.Uniform,
// 			[
// 				'Dress Blue A',
// 				'Dress Blue B',
// 				'Battle Dress Uniform or Airman Battle Uniform (BDU ABU)',
// 				'PT Gear',
// 				'Polo Shirts (Senior Members)',
// 				'Blue Utilities (Senior Members)',
// 				'Civilian Attire',
// 				'Flight Suit',
// 				'Not Applicable',
// 			],
// 			false
// 		),
// 	});

// 	const newEvents: Event[] = [];

// 	if (runCopy === RunFlag.RUN) {
// 		for (const oldEvent of oldEvents) {
// 			const newEventObject = transformEvent(oldEvent);

// 			if (!accounts.find(acc => acc.id === oldEvent.AccountID)) {
// 				console.log(`Couldn't find account ${oldEvent.AccountID}!`);
// 				continue;
// 			}

// 			const newEvent = await Event.Create(
// 				newEventObject,
// 				accounts.find(acc => acc.id === oldEvent.AccountID)!,
// 				to,
// 				newEventObject.author as NHQMemberReference
// 			);

// 			newEvent.id = oldEvent.EventNumber;

// 			await newEvent.save();

// 			newEvents.push(newEvent);

// 			console.log(`Added event ${newEvent.accountID}-${newEvent.id}`);

// 			await new Promise(res => setTimeout(res, 500));
// 		}

// 		console.log('Moved events.');
// 	} else {
// 		for (const oldEvent of oldEvents) {
// 			const account = accounts.find(acc => acc.id === oldEvent.AccountID);
// 			if (!account) {
// 				console.log(`Couldn't find account ${oldEvent.AccountID}!`);
// 				continue;
// 			}

// 			newEvents.push(await Event.Get(oldEvent.EventNumber, account, to));
// 		}
// 	}

// 	console.log('Moving attendance...');

// 	for (const record of oldAttendance) {
// 		const event = newEvents.find(
// 			ev => ev.accountID === record.AccountID && ev.id === record.EventID
// 		);

// 		if (!event) {
// 			console.log(`Couldn't find event ${record.AccountID}-${record.EventID}`);
// 			continue;
// 		}

// 		await event.addMemberToAttendance(
// 			{
// 				arrivalTime: null,
// 				comments: record.Comments,
// 				customAttendanceFieldValues: [],
// 				departureTime: null,
// 				planToUseCAPTransportation: record.PlanToUseCAPTransportation === 1,
// 				status: parseRadioValue(
// 					record.Status,
// 					[
// 						'Committed/Attended',
// 						'No show',
// 						'Rescinded commitment to attend',
// 						'Not planning to attend',
// 					],
// 					AttendanceStatus.NOSHOW,
// 					false
// 				),
// 				memberID: {
// 					type: 'CAPNHQMember',
// 					id: record.CAPID,
// 				},
// 			},
// 			{
// 				getReference() {
// 					return {
// 						type: 'CAPNHQMember',
// 						id: record.CAPID,
// 					};
// 				},
// 				getFullName() {
// 					return record.MemberRankName;
// 				},
// 				matchesReference(ref: MemberReference) {
// 					return areMemberReferencesTheSame(
// 						{ type: 'CAPNHQMember', id: record.CAPID },
// 						ref
// 					);
// 				},
// 			} as MemberBase
// 		);
// 	}

// 	console.log('Moved attendance. Moving special attendance...');

// 	for (const record of oldSpecialAttendance) {
// 		const event = newEvents.find(
// 			ev => ev.accountID === record.AccountID && ev.id === record.EventID
// 		);

// 		if (!event) {
// 			console.log(`Couldn't find event ${record.AccountID}-${record.EventID}`);
// 			continue;
// 		}

// 		await event.addMemberToAttendance(
// 			{
// 				arrivalTime: null,
// 				comments: record.Comments,
// 				customAttendanceFieldValues: [
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What is your geographic location?',
// 						value: record.GeoLoc,
// 					},
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What are your top 3 desired duty/training positions?',
// 						value: record.DutyPreference,
// 					},
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What is your email address?',
// 						value: record.EmailAddress,
// 					},
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What is your phone number?',
// 						value: record.PhoneNumber,
// 					},
// 					{
// 						type: CustomAttendanceFieldEntryType.TEXT,
// 						title: 'What uniform are you planning to wear?',
// 						value: record.Uniform,
// 					},
// 				],
// 				departureTime: null,
// 				planToUseCAPTransportation: record.PlanToUseCAPTransportation === 1,
// 				status: parseRadioValue(
// 					record.Status,
// 					[
// 						'Committed/Attended',
// 						'No show',
// 						'Rescinded commitment to attend',
// 						'Not planning to attend',
// 					],
// 					AttendanceStatus.NOSHOW,
// 					false
// 				),
// 				memberID: {
// 					type: 'CAPNHQMember',
// 					id: record.CAPID,
// 				},
// 			},
// 			{
// 				getReference() {
// 					return {
// 						type: 'CAPNHQMember',
// 						id: record.CAPID,
// 					};
// 				},
// 				getFullName() {
// 					return record.MemberRankName;
// 				},
// 				matchesReference(ref: MemberReference) {
// 					return areMemberReferencesTheSame(
// 						{ type: 'CAPNHQMember', id: record.CAPID },
// 						ref
// 					);
// 				},
// 			} as MemberBase
// 		);
// 	}

// 	console.log('Moved special attendance.');
// }

// async function moveFiles(from: mysql.Connection, to: Schema, run: RunFlag) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	console.log('Moving files...');

// 	const fileCollection = await getOrCreate<RawFileObject>(to, 'Files');

// 	await clearCollection(fileCollection);

// 	const fileInfo = (await new Promise((res, rej) => {
// 		from.query('SELECT * FROM FileData;', (err, results) => {
// 			if (err) {
// 				rej(err);
// 				return;
// 			}

// 			res(results);
// 		});
// 	})) as V3.FileData[];

// 	const fileStoragePath = conf.fileStoragePath;

// 	fileInfo.forEach(info => {
// 		writeFileSync(join(fileStoragePath, `${info.AccountID}-${info.ID}`), info.Data);
// 	});

// 	const fileObjects: RawFileObject[] = fileInfo.map(file => ({
// 		accountID: file.AccountID,
// 		comments: file.Comments,
// 		contentType: file.ContentType,
// 		created: file.Created * 1000,
// 		fileChildren: [],
// 		fileName: file.Name,
// 		forDisplay: false,
// 		forSlideshow: file.ForSlideshow === 1,
// 		id: file.ID,
// 		kind: 'drive#file' as const,
// 		owner: {
// 			type: 'CAPNHQMember',
// 			id: file.UploadI,
// 		},
// 		parentID: 'root',
// 		permissions: [
// 			{
// 				type: FileUserAccessControlType.OTHER,
// 				permission: FileUserAccessControlPermissions.READ,
// 			},
// 		],
// 	}));

// 	for (const object of fileObjects) {
// 		await fileCollection.add(object).execute();
// 		console.log(`Added file ${object.id} for account ${object.accountID}`);
// 	}

// 	console.log('Moved files.');
// }

// async function moveTeams(from: mysql.Connection, to: Schema, accounts: Account[], run: RunFlag) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	console.log('Moving teams...');

// 	const teamsCollection = await getOrCreate<RawTeamObject>(to, 'Teams');

// 	await clearCollection(teamsCollection);

// 	const [teamInfo, teamMemberInfo] = (await Promise.all([
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM Team;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM TeamMembers;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 	])) as [V3.OldTeam[], V3.TeamMembers[]];

// 	const toReference = (id: number | null): MemberReference =>
// 		!!id
// 			? {
// 					type: 'CAPNHQMember',
// 					id,
// 			  }
// 			: {
// 					type: 'Null',
// 			  };

// 	const newTeamInfo = teamInfo.map(oldTeam => ({
// 		team: {
// 			cadetLeader: toReference(oldTeam.TeamLead),
// 			description: oldTeam.TeamDescription,
// 			members: teamMemberInfo
// 				.filter(member => member.TeamID === oldTeam.TeamID)
// 				.map(member => ({
// 					job: member.Role,
// 					reference: {
// 						type: 'CAPNHQMember',
// 						id: member.CAPID,
// 					} as const,
// 				})),
// 			name: oldTeam.TeamName,
// 			seniorCoach: toReference(oldTeam.TeamCoach),
// 			seniorMentor: toReference(oldTeam.TeamMentor),
// 			visibility: TeamPublicity.PROTECTED,
// 		},
// 		accountID: oldTeam.AccountID,
// 	}));

// 	for (const team of newTeamInfo) {
// 		const account = accounts.find(acc => team.accountID === acc.id);
// 		if (account) {
// 			await Team.Create(
// 				team.team,
// 				account,
// 				to,
// 				new EventEmitter() as MemberUpdateEventEmitter
// 			);
// 			console.log(`Added team ${team.team.name}`);
// 		} else {
// 			console.log(`Could not find account ${team.accountID}`);
// 		}
// 	}

// 	console.log('Moved teams.');
// }

// async function moveExtraMemberInfo(from: mysql.Connection, to: Schema, run: RunFlag) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	console.log('Moving extra member information...');

// 	const extraInfoCollection = await getOrCreate<ExtraMemberInformation>(
// 		to,
// 		'ExtraMemberInformation'
// 	);

// 	await clearCollection(extraInfoCollection);

// 	const [teamInfo, flights] = (await Promise.all([
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM TeamMembers;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM Flights;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 	])) as [V3.TeamMembers[], V3.Flights[]];

// 	const extraInfo: ExtraMemberInformation[] = flights.map(flight => ({
// 		absentee: null,
// 		accountID: flight.AccountID,
// 		flight: flight.Flight,
// 		member: {
// 			type: 'CAPNHQMember',
// 			id: flight.CAPID,
// 		},
// 		temporaryDutyPositions: [],
// 		teamIDs: teamInfo.filter(team => team.CAPID === flight.CAPID).map(team => team.TeamID),
// 	}));

// 	for (const datum of extraInfo) {
// 		console.log(`Added extra info for ${(datum.member as NHQMemberReference).id}`);
// 		await extraInfoCollection.add(datum).execute();
// 	}

// 	console.log('Moved extra member information.');
// }

// async function moveUsers(from: mysql.Connection, to: Schema, run: RunFlag) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	console.log('Moving users...');

// 	const userAccountCollection = await getOrCreate<UserAccountInformation>(to, 'UserAccountInfo');

// 	await clearCollection(userAccountCollection);

// 	const [oldAccounts, oldPasswords] = (await Promise.all([
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM UserAccountInfo', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM UserPasswordData', (err, results) => {
// 				if (err) {
// 					rej(err);
// 					return;
// 				}

// 				res(results);
// 			});
// 		}),
// 	])) as [V3.UserAccountInfo[], V3.UserPasswordData[]];

// 	const accounts: UserAccountInformation[] = oldAccounts.map(acc => ({
// 		member: {
// 			type: 'CAPNHQMember',
// 			id: acc.CAPID,
// 		},
// 		username: acc.UserID,
// 		passwordHistory: [],
// 	}));

// 	oldPasswords.sort((a, b) => parseInt(a.HistoryIndex, 10) - parseInt(b.HistoryIndex, 10));

// 	for (const passwordRecord of oldPasswords) {
// 		const account = accounts.find(acc => acc.username === passwordRecord.UserID);

// 		account?.passwordHistory.push({
// 			created: passwordRecord.AddTime * 1000,
// 			iterations: passwordRecord.PasswordIterationCount,
// 			password: passwordRecord.PasswordHash,
// 			salt: passwordRecord.PasswordSalt,
// 			algorithm: 'pbkdf2',
// 		});
// 	}

// 	for (const account of accounts) {
// 		console.log(
// 			`Added user account info for ${(account.member as NHQMemberReference).id} - ${
// 				account.username
// 			}`
// 		);
// 		await userAccountCollection.add(account).execute();
// 	}

// 	console.log('Moved users.');
// }

// async function movePermissions(from: mysql.Connection, to: Schema, run: RunFlag) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	console.log('Moving permissions...');

// 	const permissionsCollection = await getOrCreate<StoredMemberPermissions>(to, 'UserPermissions');

// 	await clearCollection(permissionsCollection);

// 	const oldPermissions: V3.UserAccessLevels[] = await new Promise((res, rej) => {
// 		from.query('SELECT * FROM UserAccessLevels;', (err, results) => {
// 			if (err) {
// 				rej(err);
// 				return;
// 			}

// 			res(results);
// 		});
// 	});

// 	for (const permissionSet of oldPermissions) {
// 		const permissionInfo =
// 			permissionSet.AccessLevel === 'Admin'
// 				? Permissions.Admin
// 				: permissionSet.AccessLevel === 'CadetStaff'
// 				? Permissions.Staff
// 				: permissionSet.AccessLevel === 'Manager'
// 				? Permissions.Manager
// 				: Permissions.Member;

// 		console.log(`Added permissions for ${permissionSet.capid} - ${permissionSet.AccessLevel}`);

// 		await permissionsCollection
// 			.add({
// 				accountID: permissionSet.AccountID,
// 				member: {
// 					type: 'CAPNHQMember',
// 					id: permissionSet.capid,
// 				},
// 				permissions: permissionInfo,
// 			})
// 			.execute();
// 	}

// 	console.log('Moved permissions.');
// }

// async function moveRegistry(from: mysql.Connection, to: Schema, run: RunFlag) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	console.log('Moving registries...');

// 	const registryCollection = await getOrCreate<RegistryValues>(to, 'Registry');

// 	await clearCollection(registryCollection);

// 	const oldRegistries: V3.Registry[] = await new Promise((res, rej) => {
// 		from.query('SELECT * FROM Registry;', (err, results) => {
// 			if (err) {
// 				rej(err);
// 				return;
// 			}

// 			res(results);
// 		});
// 	});

// 	const setProp = (obj: any, path: string, value: string) => {
// 		const pathElements = path.split('.');

// 		if (pathElements.length === 1) {
// 			obj[pathElements[0]] = value;
// 		} else {
// 			setProp(
// 				(obj[pathElements[0]] = obj[pathElements[0]] || {}),
// 				pathElements.slice(1).join('.'),
// 				value
// 			);
// 		}
// 	};

// 	const clone = <T>(obj: T & object) => {
// 		const newObj: T = {} as T;

// 		for (const i in obj) {
// 			if (obj.hasOwnProperty(i)) {
// 				if (typeof obj[i] === 'object') {
// 					newObj[i as keyof T] = clone(obj[i] as any);
// 				} else {
// 					newObj[i as keyof T] = obj[i];
// 				}
// 			}
// 		}

// 		return newObj;
// 	};

// 	const globalConfigs = oldRegistries.filter(reg => reg.AccountID === 'www');
// 	const unitConfigs = oldRegistries.filter(reg => reg.AccountID !== 'www');
// 	const globalConfig = {};

// 	for (const regValue of globalConfigs) {
// 		setProp(globalConfig, regValue.RegistryKey, regValue.Value);
// 	}

// 	const configs: { [key: string]: any } = {};

// 	for (const row of unitConfigs) {
// 		if (!configs[row.AccountID]) {
// 			configs[row.AccountID] = clone(globalConfig);
// 		}

// 		setProp(configs[row.AccountID], row.RegistryKey, row.Value);
// 	}

// 	const registries: RegistryValues[] = [];

// 	const stringOrNull = (thing: string) => (thing !== '' ? thing : null);

// 	for (const accountID in configs) {
// 		if (configs.hasOwnProperty(accountID)) {
// 			console.log(`Added registry for ${accountID}`);

// 			const config = configs[accountID];
// 			registries.push({
// 				id: accountID,
// 				accountID,

// 				Contact: {
// 					Discord: null,
// 					FaceBook: stringOrNull(config.Contact.FaceBook),
// 					Flickr: stringOrNull(config.Contact.Flickr),
// 					Instagram: stringOrNull(config.Contact.Instagram),
// 					LinkedIn: stringOrNull(config.Contact.LinkedIn),
// 					MailingAddress:
// 						config.Contact.MailingAddress.FirstLine !== '' &&
// 						config.Contact.MailingAddress.Name !== ''
// 							? {
// 									Name: config.Contact.MailingAddress.Name,
// 									FirstLine: config.Contact.MailingAddress.FirstLine,
// 									SecondLine: config.Contact.MailingAddress.SecondLine,
// 							  }
// 							: null,
// 					MeetingAddress:
// 						config.Contact.MeetingAddress.FirstLine !== '' &&
// 						config.Contact.MeetingAddress.Name !== ''
// 							? {
// 									Name: config.Contact.MeetingAddress.Name,
// 									FirstLine: config.Contact.MeetingAddress.FirstLine,
// 									SecondLine: config.Contact.MeetingAddress.SecondLine,
// 							  }
// 							: null,
// 					Twitter: stringOrNull(config.Contact.Twitter),
// 					YouTube: stringOrNull(config.Contact.YouTube),
// 				},
// 				RankAndFile: {
// 					Flights: [
// 						stringOrNull(config.Administration.FlightNames.Default),
// 						stringOrNull(config.Administration.FlightNames.Flight1),
// 						stringOrNull(config.Administration.FlightNames.Flight2),
// 						stringOrNull(config.Administration.FlightNames.Flight3),
// 						stringOrNull(config.Administration.FlightNames.Flight4),
// 						stringOrNull(config.Administration.FlightNames.Flight5),
// 						stringOrNull(config.Administration.FlightNames.Flight6),
// 						stringOrNull(config.Administration.FlightNames.Flight7),
// 					].filter(v => !!v) as string[],
// 				},
// 				Website: {
// 					Name: config.Website.Name,
// 					PhotoLibraryImagesPerPage: parseInt(config.PhotoLibrary.PPP, 10) || 50,
// 					Separator: config.Website.Separator,
// 					ShowUpcomingEventCount: parseInt(config.Website.ShowUpcomingEvents, 10) || 7,
// 					Timezone: 'America/New_York',
// 				},
// 			});
// 		}
// 	}

// 	for (const registry of registries) {
// 		await registryCollection.add(registry).execute();
// 	}

// 	console.log('Moved registries.');
// }

// async function moveMemberData(from: mysql.Connection, to: Schema, run: RunFlag) {
// 	if (run === RunFlag.NORUN) {
// 		return;
// 	}

// 	const memberCollection = to.getCollection<NHQ.CAPMember>('NHQ_Member');
// 	const mbrContactCollection = to.getCollection<NHQ.MbrContact>('NHQ_MbrContact');

// 	await clearCollection(memberCollection);
// 	await clearCollection(mbrContactCollection);

// 	console.log('Moving member CAPWATCH data...');

// 	const [oldMemberContact, oldMembers] = (await Promise.all([
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM Data_MbrContact;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 				}

// 				res(results);
// 			});
// 		}),
// 		new Promise((res, rej) => {
// 			from.query('SELECT * FROM Data_Member;', (err, results) => {
// 				if (err) {
// 					rej(err);
// 				}

// 				res(results);
// 			});
// 		}),
// 	])) as [V3.Data_MbrContact[], V3.Data_Member[]];

// 	const newMembers: NHQ.CAPMember[] = oldMembers.map(mem => ({
// 		CAPID: mem.CAPID,
// 		CdtWaiver: mem.CdtWaiver,
// 		Citizen: mem.Citizen,
// 		DOB: new Date(mem.DOB * 1000).toISOString(),
// 		DateMod: new Date(mem.DateMod * 1000).toISOString(),
// 		EducationLevel: mem.EducationLevel,
// 		Expiration: new Date(mem.Expiration * 1000).toISOString(),
// 		Gender: mem.Gender,
// 		Joined: new Date(mem.Joined * 1000).toISOString(),
// 		LSCode: mem.LSCode,
// 		MbrStatus: mem.MbrSt,
// 		NameFirst: mem.NameFirst,
// 		NameLast: mem.NameLast,
// 		NameMiddle: mem.NameMiddle,
// 		NameSuffix: mem.NameSuffix,
// 		ORGID: mem.ORGID,
// 		OrgJoined: new Date(mem.OrgJoined * 1000).toISOString(),
// 		PicDate: new Date().toISOString(),
// 		PicStatus: mem.PicStatus,
// 		Profession: mem.Profession,
// 		Rank: mem.Rank,
// 		RankDate: new Date(mem.RankDate).toISOString(),
// 		Region: mem.Region,
// 		SSN: '',
// 		Type: mem.Type as
// 			| 'NULL'
// 			| 'CADET'
// 			| 'CADET SPONSOR'
// 			| 'SENIOR'
// 			| 'PATRON'
// 			| 'FIFTY YEAR'
// 			| 'FiftyYear'
// 			| 'INDEFINITE'
// 			| 'LIFE'
// 			| 'STATE LEG',
// 		Wing: mem.Wing,
// 		UsrID: mem.UsrID,
// 		Unit: mem.UNIT,
// 	}));

// 	const newMemberContact: NHQ.MbrContact[] = oldMemberContact.map(cont => ({
// 		CAPID: cont.CAPID,
// 		Contact: cont.Contact,
// 		DateMod: new Date(cont.DateMod * 1000).toISOString(),
// 		DoNotContact: cont.DoNotContact,
// 		Priority: cont.Priority as 'PRIMARY' | 'SECONDARY' | 'EMERGENCY',
// 		Type: cont.Type as
// 			| 'ALPHAPAGER'
// 			| 'ASSISTANT'
// 			| 'CADETPARENTEMAIL'
// 			| 'CADETPARENTPHONE'
// 			| 'CELLPHONE'
// 			| 'DIGITALPAGER'
// 			| 'EMAIL'
// 			| 'HOMEFAX'
// 			| 'HOMEPHONE'
// 			| 'INSTANTMESSAGER'
// 			| 'ISDN'
// 			| 'RADIO'
// 			| 'TELEX'
// 			| 'WORKFAX'
// 			| 'WORKPHONE',
// 		UsrID: cont.UsrID,
// 	}));

// 	for (const member of newMembers) {
// 		await memberCollection.add(member).execute();
// 	}

// 	for (const mbrContact of newMemberContact) {
// 		await mbrContactCollection.add(mbrContact).execute();
// 	}

// 	console.log('Moved member CAPWATCH data.');
// }
