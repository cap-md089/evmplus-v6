import { generateAPITree } from 'auto-client-api';
import { api, defaultAPICallBase } from 'common-lib';

type Tree = {
	errors: {
		clientError: api.errors.ClientError;
		getErrors: api.errors.GetErrors;
		markErrorDone: api.errors.MarkErrorAsDone;
	};
	events: {
		account: {
			create: api.events.accounts.AddEventAccount;
		};
		attendance: {
			get: api.events.attendance.GetAttendance;
			add: api.events.attendance.Add;
			addBulk: api.events.attendance.AddBulk;
			delete: api.events.attendance.Delete;
			modify: api.events.attendance.ModifyAttendance;
		};
		debrief: {
			add: api.events.debrief.Add;
			delete: api.events.debrief.Delete;
		};
		events: {
			add: api.events.events.Add;
			copy: api.events.events.Copy;
			get: api.events.events.Get;
			getViewerData: api.events.events.GetEventViewerData;
			getNextRecurring: api.events.events.GetNextRecurring;
			getUpcoming: api.events.events.GetUpcoming;
			getList: api.events.events.GetList;
			getRange: api.events.events.GetRange;
			link: api.events.events.Link;
			set: api.events.events.Set;
			delete: api.events.events.Delete;
		};
	};
	files: {
		files: {
			createFolder: api.files.files.CreateFolder;
			get: api.files.files.GetFile;
			getFull: api.files.files.GetFullFile;
			setInfo: api.files.files.SetInfo;
			delete: api.files.files.Delete;
		};
		children: {
			getBasic: api.files.children.GetBasicFiles;
			getFull: api.files.children.GetFullFiles;
			add: api.files.children.AddChild;
			remove: api.files.children.RemoveChild;
		};
	};
	member: {
		account: {
			capnhq: {
				usernameRequest: api.member.account.capnhq.UsernameRequest;
				requestNHQAccount: api.member.account.capnhq.RequestNHQAccount;
			};
			capprospective: {
				requestProspectiveAccount: api.member.account.capprospective.CreateProspectiveAccount;
			};
			registerDiscord: api.member.account.RegisterDiscord;
			passwordResetRequest: api.member.account.PasswordResetRequest;
			finishPasswordReset: api.member.account.FinishPasswordReset;
			finishAccountSetup: api.member.account.FinishAccountSetup;
		};
		attendance: {
			get: api.member.attendance.Get;
			getForGroup: api.member.attendance.GetForGroup;
			getForMember: api.member.attendance.GetForMember;
		};
		capwatch: {
			requestImport: api.member.capwatch.RequestImport;
		};
		flight: {
			assign: api.member.flight.Assign;
			assignBulk: api.member.flight.AssignBulk;
			membersBasic: api.member.flight.FlightMembersBasic;
			membersFull: api.member.flight.FlightMembersFull;
		};
		permissions: {
			set: api.member.permissions.SetPermissions;
			get: api.member.permissions.GetPermissions;
		};
		temporaryDutyPositions: {
			get: api.member.temporarydutypositions.GetTemporaryDutyPositions;
			set: api.member.temporarydutypositions.SetTemporaryDutyPositions;
		};
		setAbsentee: api.member.SetAbsenteeInformation;
		passwordReset: api.member.PasswordReset;
		memberList: api.member.Members;
		su: api.member.Su;
	};
	notifications: {
		global: {
			create: api.notifications.global.CreateGlobalNotification;
			get: api.notifications.global.GetGlobalNotification;
		};
		get: api.notifications.GetNotification;
		list: api.notifications.GetNotificationList;
		toggleRead: api.notifications.ToggleNotificationRead;
		delete: api.notifications.DeleteNotification;
	};
	registry: {
		get: api.registry.GetRegistry;
		set: api.registry.SetRegistry;
	};
	tasks: {
		create: api.tasks.CreateTask;
		get: api.tasks.GetTask;
		list: api.tasks.ListTasks;
		edit: api.tasks.EditTask;
		delete: api.tasks.DeleteTask;
	};
	team: {
		members: {
			list: api.team.members.ListTeamMembers;
			modify: api.team.members.ModifyTeamMember;
			add: api.team.members.AddTeamMember;
			delete: api.team.members.DeleteTeamMember;
		};
		create: api.team.CreateTeam;
		get: api.team.GetTeam;
		list: api.team.ListTeams;
		delete: api.team.DeleteTeam;
		set: api.team.SetTeamData;
	};
	accountCheck: api.AccountCheck;
	check: api.Check;
	signin: api.Signin;
	echo: api.Echo;
	slideshowImageIDs: api.SlideshowImageIDs;
	token: api.FormToken;
};

export default (fetchFunction: typeof fetch) => {
	const caller = defaultAPICallBase(fetchFunction);

	return generateAPITree<Tree>(caller);
};
