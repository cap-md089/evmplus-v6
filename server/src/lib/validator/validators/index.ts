import _DebriefValidator from './DebriefValidator';
import _EventValidator from './EventValidator';
import _FileObjectValidator from './FileObjectValidator';
import _NewAccountObjectValidator from './NewAccountObject';
import _NewAttendanceRecordValidator from './NewAttendanceRecord';
import _NewTeamMemberValidator from './NewTeamMember';
import _NewTeamObjectValidator from './NewTeamObject';
import _RegistryValueValidator from './RegistryValues';

export { default as AbsenteeValidator } from './AbsenteeValidator';
export const DebriefValidator = new _DebriefValidator();
export const EventValidator = new _EventValidator();
export const FileObjectValidator = new _FileObjectValidator();
export { default as FlightAssignBulkValidator } from './FlightAssignBulkValidator';
export { default as FlightAssignValidator } from './FlightAssignValidator';
export const NewAccountObjectValidator = new _NewAccountObjectValidator();
export const NewAttendanceRecordValidator = new _NewAttendanceRecordValidator();
export { default as NewDebriefItemValidator } from './NewDebriefItemValidator';
export { default as NewTaskObjectValidator } from './NewTaskObject';
export const NewTeamMemberValidator = new _NewTeamMemberValidator();
export const NewTeamObjectValidator = new _NewTeamObjectValidator();
export { default as PermissionsValidator } from './PermissionValidator';
export { default as RawTaskObjectValidator } from './RawTaskObject';
export const RegistryValueValidator = new _RegistryValueValidator();

export * from './FlightAssignValidator';
export * from './FlightAssignBulkValidator';
