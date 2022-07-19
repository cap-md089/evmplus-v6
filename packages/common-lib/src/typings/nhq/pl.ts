// Copyright (C) 2022 Andrew Rioux
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

export interface Groups {
	GroupID: number;
	PathID: number;
	GroupName: string;
	NumberOfRequiredTasks: number;
	AwardsExtraCredit: number;
}

export interface Paths {
	PathID: number;
	PathName: string;
}

export interface TaskGroupAssignments {
	TaskGroupAssignmentID: number;
	TaskID: number;
	GroupID: number;
}

export interface Tasks {
	TaskID: number;
	TaskName: string;
	Description: string;
}

export interface MemberTaskCredit {
	MemberTaskCreditID: number;
	TaskID: number;
	CAPID: number;
	StatusID: number;
	Completed: string;
	Expiration: string | null;
	Comments: string;
	AdditionalOptions: string;
}

export interface MemberPathCredit {
	MemberPathCreditID: number;
	PathID: number;
	CAPID: number;
	StatusID: number;
	Completed: string;
	Expiration: string | null;
	ExtraCreditEarned: string;
}

export interface Lookup {
	LookupID: number;
	LookupType: string;
	LookupValue: string;
}
