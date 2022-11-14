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
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldFile,
	identity,
} from 'common-lib';
import * as React from 'react';
import {
	Checkbox,
	DateTimeInput,
	FormBlock,
	Label,
	NumberInput,
	TextInput,
} from '../forms/SimpleForm';
import EnumRadioButton from './EnumRadioButton';
import { BooleanForField } from './FormBlock';
import { InputProps } from './Input';
import LaxAutocomplete from './LaxAutocomplete';

const OpsQuals = [
	'Achievement 1 (Curry)',
	'ACUT - Advanced Communications User Training',
	'BCUT - Basic Communications User Training',
	'ICUT - Introductory Communications User Training',
	'Level 1 ',
	'Level II',
	'Level III',
	'Level IV',
	'Level V',
	'ARCHOPR - ARCHER Operator',
	'ARCHSPC - ARCHER Field Spectrometer Operator',
	'ARCHTRK - ARCHER Trac Technicians',
	'Air Crew Emergency Training (ACET) Instructor',
	'ATC - Auto Tow Crew Member',
	'ATE - Auto Tow Evaluator',
	'ATI - Auto Tow Instructor',
	'ATO - Auto Tow Operator',
	'Balloon Pilot',
	'Balloon Pilot Rating',
	'Basic Medical',
	'Basic Medical - Military Waiver',
	'Cadet Pre-Solo Pilot Award',
	'CAP Aircrew Rating',
	'CAP Master Aircrew Rating',
	'CAP Master Observer Rating',
	'CAP Observer Rating',
	'CAP Senior Aircrew Rating',
	'CAP Senior Observer Rating',
	'Check Pilot - Airplane',
	'Check Pilot - Balloon',
	'Check Pilot - G1000',
	'Check Pilot - Glider',
	'Check Pilot - sUAS',
	'Check Pilot Examiner - Airplane',
	'Check Pilot Examiner - Balloon',
	'Check Pilot Examiner - Glider',
	'Check Pilot Examiner - sUAS',
	'Check Pilot Examiners - G1000',
	'Command Pilot Rating',
	'Glider Pilot',
	'Glider Pilot Rating',
	'Instructor Pilot - Airplane',
	'Instructor Pilot - Balloon',
	'Instructor Pilot - G1000',
	'Instructor Pilot - Glider',
	'Instructor Pilot - sUAS',
	'Instructor Pilot - Tow',
	'Instrument Pilot',
	'Instrument Pilot - G1000',
	'Mission Check Pilot',
	'Mission Check Pilot - G1000',
	'Mission Check Pilot Examiner',
	'Orientation Pilot - AFROTC',
	'Orientation Pilot - Airplane',
	'Orientation Pilot - Balloon',
	'Orientation Pilot - Glider',
	'Pilot Rating',
	'Senior Pilot Rating',
	'Solo Pilot - Airplane',
	'Solo Pilot - Balloon',
	'Solo Pilot - Glider',
	'Solo Pilot Rating',
	'sUAS Command Pilot Rating',
	'sUAS Pilot Rating',
	'sUAS Recreational Pilot',
	'sUAS Senior Pilot Rating',
	'Tow Pilot',
	'Tow Pilot - Trainee',
	'Tow Pilot Trainer',
	'VFR Pilot',
	'VFR Pilot - G1000',
	'WE - Winch Evaluator',
	'WI - Winch Instructor',
	'WO - Winch Operator',
	'Check Pilot - G1000 (CAP Trained) (OLD)',
	'Instructor Pilot - G1000 (CAP Trained) (OLD)',
	'Instrument Pilot - G1000 (CAP Trained) (OLD)',
	'CISM - Critical Incident Stress Management Personnel',
	'CD - Counterdrug',
	'CAP Drivers License',
	'ADIS - Aerial Digital Imaging System Operator',
	'AOBD - Air Operations Branch Director',
	'AP - Airborne Photographer',
	'Basic Incident Commander Badge',
	'CAP Basic Emergency Services Qualification Badge',
	'CAP Basic Ground Team Badge',
	'CAP CN Observer',
	'CAP Emergency Services Patch',
	'CAP Master Emergency Services Qualification Badge',
	'CAP Master Ground Team Badge',
	'CAP Senior Emergency Services Qualification Badge',
	'CAP Senior Ground Team Badge',
	'CERT - Community Emergency Response Team',
	'CSSCS - Chaplain Support Specialist (CAP Support Rating)',
	'CSSDS - Chaplain Support Specialist (Disaster Support Rating)',
	'CUL - Communications Unit Leader',
	'DAARTO - Domestic Operations Awareness and Assessment Response Tool Operator',
	'DAARTU - Domestic Operations Awareness and Assessment Response Tool User',
	'FASC - Finance/Admin Section Chief ',
	'FLM - Flight Line Marshaller',
	'FLS - Flight Line Supervisor',
	'FRO - Flight Release Officer',
	'GBD - Ground Branch Director',
	'GES - General Emergency Services',
	'GFMC - Surrogate Unmanned Aerial System Green Flag Mission Coordinator',
	'GFMP - Surrogate Unmanned Aerial System Green Flag Mission Pilot',
	'GFSO - Surrogate Unmanned Aerial System Green Flag Sensor Operator',
	'GIIEP - Geospatial Information Interoperability Exploitation Portable Operator',
	'GTL - Ground Team Leader',
	'GTM1 - Ground Team Member Level 1',
	'GTM2 - Ground Team Member Level 2',
	'GTM3 - Ground Team Member Level 3',
	'IC1 - Incident Commander Level 1',
	'IC2 - Incident Commander Level 2',
	'IC3 - Incident Commander Level 3',
	'ICS300 - ICS-300',
	'ICS400 - ICS-400',
	'IS100 - IS-100',
	'IS200 - IS-200',
	'IS3 - IS-3 Radiological Emergency Management',
	'IS368 - IS-368',
	'IS405 - IS-405',
	'IS5.A - IS-5A An Introduction to Hazardous Materials',
	'IS505 - IS-505',
	'IS520 - IS-520',
	'IS700 - IS-700',
	'IS800 - IS-800',
	'K2300 EOC Intermediate Operations Course',
	'LO - Liaison Officer',
	'LSC - Logistics Section Chief',
	'Master Incident Commander Badge',
	'MC - Mission Chaplain',
	'MCAF - Mission Chaplain (USAF Support Rated)',
	'MCCS - Mission Chaplain (CAP Support Rating)',
	'MCDS - Mission Chaplain (Disaster Support Rating)',
	'MFC - Mountain Flying Certification',
	'MO - Mission Observer',
	'MP - SAR/DR Mission Pilot',
	'MRO - Mission Radio Operator',
	'MS - Mission Scanner',
	'MSA - Mission Staff Assistant',
	'MSO - Mission Safety Officer',
	'OSC - Operations Section Chief',
	'PIO - Public Information Officer',
	'PODC - Point of Distribution Course',
	'PSC - Planning Section Chief',
	'Senior Incident Commander Badge',
	'SET - Skills Evaluator Training',
	'SFGC - Shelter Field Guide Course',
	'SFRO - Senior Flight Release Officer',
	'SMC/BISC - AFRCC SAR Management Course',
	'SPC - National Inland SAR Planning Course',
	'TMP - Transport Mission Pilot',
	'UAO - Unit Alert Officer',
	'UASMP - sUAS Mission Pilot',
	'UAST - sUAS Technician',
	'UDF - Urban Direction Finding Team',
	'WAO - Wing Alert Officer',
	'WS - Water Survival',
	'TSK9 - Technical Specialty K9 Handler',
	'NOCAUG - NOC Augmentee',
	'OPS - OPSEC',
];

export default class CustomAttendanceFieldInput extends React.Component<
	InputProps<CustomAttendanceField>
> {
	public constructor(props: InputProps<CustomAttendanceField>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: {
					type: CustomAttendanceFieldEntryType.TEXT,
					title: '',
					preFill: '',
					displayToMember: false,
					allowMemberToModify: false,
				},
			});
		}
	}

	public render(): JSX.Element {
		if (!this.props.value) {
			throw new Error('Value required');
		}

		const value = this.props.value;

		return (
			<FormBlock<CustomAttendanceField>
				name={`customAttendanceFieldInput-${this.props.index ?? 0}`}
				onFormChange={this.onUpdate}
				onInitialize={this.props.onInitialize}
				value={value}
			>
				<Label>Custom Field Type</Label>
				<EnumRadioButton<CustomAttendanceFieldEntryType>
					name="type"
					labels={['Text', 'Number', 'Date', 'Checkbox', 'File', 'OPS Qual']}
					values={[
						CustomAttendanceFieldEntryType.TEXT,
						CustomAttendanceFieldEntryType.NUMBER,
						CustomAttendanceFieldEntryType.DATE,
						CustomAttendanceFieldEntryType.CHECKBOX,
						CustomAttendanceFieldEntryType.FILE,
						CustomAttendanceFieldEntryType.QUAL,
					]}
					defaultValue={CustomAttendanceFieldEntryType.TEXT}
					index={this.props.index}
					key="type"
				/>

				<Label>Field Title</Label>
				<TextInput key="title" name="title" value={value.title} />

				{value.type !== CustomAttendanceFieldEntryType.FILE &&
				value.type !== CustomAttendanceFieldEntryType.QUAL ? (
					<Label>Field PreFill Value</Label>
				) : value.type === CustomAttendanceFieldEntryType.QUAL ? (
					<Label>Qualification</Label>
				) : null}
				{this.getPreFillInput(value)}

				<Label>Display Field To Member</Label>
				<Checkbox key="displayToMember" name="displayToMember" index={this.props.index} />

				<Label>Allow Member To Modify Field Value</Label>
				<Checkbox
					key="allowMemberToModify"
					name="allowMemberToModify"
					index={this.props.index}
				/>
			</FormBlock>
		);
	}

	private onUpdate = (
		newValue: CustomAttendanceField,
		error: BooleanForField<CustomAttendanceField>,
		changed: BooleanForField<CustomAttendanceField>,
		hasError: boolean,
		fieldChanged: keyof CustomAttendanceField,
	): void => {
		const name = `customAttendanceFieldInput-${this.props.index ?? 0}`;

		if (fieldChanged === 'type') {
			if (newValue.type === CustomAttendanceFieldEntryType.CHECKBOX) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.CHECKBOX,
						preFill: false,
					},
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.DATE) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.DATE,
						preFill: Date.now(),
					},
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.FILE) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.FILE,
					} as CustomAttendanceFieldFile,
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.NUMBER) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.NUMBER,
						preFill: 0,
					},
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.TEXT) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.TEXT,
						preFill: '',
					},
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.QUAL) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: false,
						displayToMember: true,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						title: newValue.title,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						type: CustomAttendanceFieldEntryType.QUAL,
						preFill: '',
					},
				});
			} else {
				throw new Error('Weird state');
			}
		} else {
			this.props.onUpdate?.({
				name,
				value: newValue,
			});
		}
	};

	private getPreFillInput = (inValue: CustomAttendanceField): JSX.Element | null => {
		switch (inValue.type) {
			case CustomAttendanceFieldEntryType.TEXT:
				return <TextInput key="prefill" name="preFill" value={inValue.preFill} />;
			case CustomAttendanceFieldEntryType.NUMBER:
				return <NumberInput key="prefill" name="preFill" value={inValue.preFill} />;
			case CustomAttendanceFieldEntryType.CHECKBOX:
				return (
					<Checkbox
						key="prefill"
						name="preFill"
						value={inValue.preFill}
						index={this.props.index}
					/>
				);
			case CustomAttendanceFieldEntryType.DATE:
				return (
					<DateTimeInput
						key="prefill"
						name="preFill"
						value={inValue.preFill}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
				);
			case CustomAttendanceFieldEntryType.QUAL:
				return <LaxAutocomplete renderItem={identity} name="preFill" items={OpsQuals} />;
			default:
				return null;
		}
	};
}
