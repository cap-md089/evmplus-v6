import { func as accountcheck } from './accountcheck';
import { func as check } from './check';
import { func as echo } from './echo';
import { func as clienterror } from './errors/clienterror';
import { func as geterrors } from './errors/geterrors';
import { func as markerrordone } from './errors/markerrordone';
import { func as createaccount } from './events/accounts/create';
import { func as addattendance } from './events/attendance/addattendance';
import { func as addattendancebulk } from './events/attendance/addattendancebulk';
import { func as deleteattendance } from './events/attendance/deleteattendance';
import { func as getattendance } from './events/attendance/getattendance';
import { func as modifyattendance } from './events/attendance/modifyattendance';
import { func as adddebrief } from './events/debrief/adddebrief';
import { func as deletedebrief } from './events/debrief/deletedebrief';
import { func as addevent } from './events/events/addevent';
import { func as copyevent } from './events/events/copy';
import { func as deleteevent } from './events/events/deleteevent';
import { func as eventviewer } from './events/events/eventviewer';
import { func as getevent } from './events/events/getevent';
import { func as getnextrecurring } from './events/events/getnextrecurring';
import { func as linkevent } from './events/events/linkevent';
import { func as listevents } from './events/events/list';
import { func as listupcoming } from './events/events/listupcoming';
import { func as setevent } from './events/events/setevent';
import { func as timelist } from './events/events/timelist';
import { func as getfiles } from './files/children/getfiles';
import { func as getfullfiles } from './files/children/getfullfiles';
import { func as insertfilechild } from './files/children/insertchild';
import { func as removefilechild } from './files/children/removefile';
import { func as createfolder } from './files/files/createfolder';
import { func as deletefile } from './files/files/deletefile';
import { func as downloadfile } from './files/files/downloadfile';
import { func as fileinfo } from './files/files/fileinfo';
import { func as fileupload } from './files/files/fileupload';
import { func as fullfileinfo } from './files/files/fullfileinfo';
import { func as getfile } from './files/files/getfile';
import { func as setfileinfo } from './files/files/setfileinfo';
import { getFormToken as formtoken } from './formtoken';
import { func as getSlideshowImageIDs } from './getSlideshowImageIDs';
import { func as setabsent } from './member/absent';
import { func as createprospective } from './member/account/capprospective/createprospective';
import { func as deleteprospective } from './member/account/capprospective/deleteprospective';
import { func as upgradeprospective } from './member/account/capprospective/upgradeprospective';
import { func as finishaccount } from './member/account/finishaccount';
import { func as finishpasswordreset } from './member/account/finishpasswordreset';
import { func as requestaccount } from './member/account/nhq/requestaccount';
import { func as requestusername } from './member/account/nhq/requestusername';
import { func as registerdiscord } from './member/account/registerdiscord';
import { func as requestpasswordreset } from './member/account/requestpasswordreset';
import { func as basicattendance } from './member/attendance/basic';
import { func as otherattendance, func as shortattendance } from './member/attendance/other';
import { func as flightassign } from './member/flights/flightassign';
import { func as flightassignbulk } from './member/flights/flightassignbulk';
import { func as flightbasic } from './member/flights/flightbasic';
import { func as flightmembers } from './member/flights/flightmembers';
import { func as getmembers } from './member/getmembers';
import { func as passwordreset } from './member/passwordreset';
import { func as getpermissions } from './member/permissions/getpermissions';
import { func as setpermissions } from './member/permissions/setpermissions';
import { func as currentuser } from './member/promotionrequirements/currentuser';
import { func as su } from './member/su';
import { func as gettemporarydutypositions } from './member/temporarydutypositions/get';
import { func as settemporarydutypositions } from './member/temporarydutypositions/set';
import { func as deletenotification } from './notifications/deletenotification';
import { func as getnotification } from './notifications/get';
import { func as createglobal } from './notifications/global/create';
import { func as getglobal } from './notifications/global/get';
import { func as listnotifications } from './notifications/list';
import { func as toggleread } from './notifications/toggleread';
import { func as getregistry } from './registry/get';
import { func as setregistry } from './registry/set';
import { func as signin } from './signin';
import { func as createtask } from './tasks/taskcreate';
import { func as deletetask } from './tasks/taskdelete';
import { func as edittask } from './tasks/taskedit';
import { func as gettask } from './tasks/taskget';
import { func as listtask } from './tasks/tasklist';
import { func as createteam } from './team/create';
import { func as deleteteam } from './team/delete';
import { func as getteam } from './team/get';
import { func as listteams } from './team/list';
import { func as teammemberadd } from './team/members/add';
import { func as teammemberlist } from './team/members/list';
import { func as teammembermodify } from './team/members/modify';
import { func as teammemberremove } from './team/members/remove';
import { func as setteam } from './team/set';

export const api = {
	errors: {
		client: clienterror,
		geterrors,
		markerrordone,
	},
	events: {
		events: {
			addevent,
			copyevent,
			deleteevent,
			eventviewer,
			getevent,
			getnextrecurring,
			linkevent,
			listevents,
			listupcoming,
			setevent,
			timelist,
		},
		accounts: {
			createaccount,
		},
		attendance: {
			addattendance,
			addattendancebulk,
			getattendance,
			modifyattendance,
			deleteattendance,
		},
		debrief: {
			adddebrief,
			deletedebrief,
		},
	},
	files: {
		files: {
			createfolder,
			deletefile,
			downloadfile,
			fileinfo,
			fileupload,
			fullfileinfo,
			getfile,
			setfileinfo,
		},
		children: {
			getfiles,
			getfullfiles,
			insertfilechild,
			removefilechild,
		},
	},
	member: {
		promotionrequirements: {
			currentuser,
		},
		account: {
			capprospective: {
				createprospective,
				deleteprospective,
				upgradeprospective,
			},
			nhq: {
				requestaccount,
				requestusername,
			},
			finishaccount,
			finishpasswordreset,
			registerdiscord,
			requestpasswordreset,
		},
		attendance: {
			basicattendance,
			otherattendance,
			shortattendance,
		},
		flights: {
			flightassign,
			flightassignbulk,
			flightbasic,
			flightmembers,
		},
		permissions: {
			getpermissions,
			setpermissions,
		},
		temporarydutypositions: {
			gettemporarydutypositions,
			settemporarydutypositions,
		},
		setabsent,
		getmembers,
		passwordreset,
		su,
	},
	notifications: {
		global: {
			getglobal,
			createglobal,
		},
		deletenotification,
		getnotification,
		listnotifications,
		toggleread,
	},
	registry: {
		get: getregistry,
		set: setregistry,
	},
	tasks: {
		createtask,
		deletetask,
		edittask,
		gettask,
		listtask,
	},
	team: {
		members: {
			teammemberadd,
			teammemberlist,
			teammembermodify,
			teammemberremove,
		},
		createteam,
		deleteteam,
		getteam,
		listteams,
		setteam,
	},
	accountcheck,
	check,
	echo,
	formtoken,
	getSlideshowImageIDs,
	signin,
};
