#!/usr/local/bin/node --no-warnings
/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession } from '@mysql/xdevapi';
import { conf } from 'server-common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { CAPNHQMemberReference, Either, EventStatus, InternalPointOfContact, Maybe, NewEventObject, OtherMultCheckboxReturn, PointOfContactType, SimpleMultCheckboxReturn, asReference, getMemberEmail, getMemberPhone, labels } from 'common-lib';
import { backendGenerator } from './lib/backend';

console.log(process.argv);
let counter = 0;

if (process.argv.length !== 5) {
    console.error('Error! Incorrect number of arguments provided: use "importEventData <accountID> <memberID> <xlsxPath>"');
    process.exit(2);
}

const xlsxPath = process.argv[4];

if (!xlsxPath.startsWith('/')) {
    console.error('Error! XLSX file path must be absolute');
    process.exit(3);
}

if (!fs.existsSync(xlsxPath)) {
    console.error('Error! XLSX file does not exist');
    process.exit(4);
}

const accountID = process.argv[2];

const memberID = parseInt(process.argv[3]);

const author: CAPNHQMemberReference = {
    type: 'CAPNHQMember',
    id: memberID,
}

process.on('unhandledRejection', up => {
    throw up;
});

const parseMultCheckbox = (labels: string[]) => (input: string): SimpleMultCheckboxReturn => {
    const inputSplit = input.split(', ');
    const values = labels.map(label => inputSplit.includes(label));
    return {
        labels,
        values,
    };
};

const parseOtherMultCheckbox = (labels: string[]) => (input: string): OtherMultCheckboxReturn => {
    const inputSplit = input.split(', ');
    const values = labels.map(label => inputSplit.includes(label));
    return {
        labels,
        values,
        otherSelected: false,
    };
};

void (async () => {
    const cliConf = await conf.getCLIConfiguration();

    const session = await getSession({
        host: cliConf.DB_HOST,
        password: cliConf.DB_PASSWORD,
        port: cliConf.DB_PORT,
        user: cliConf.DB_USER,
    });

    // const schema = session.getSchema(cliConf.DB_SCHEMA);
	// const capImport = ImportCAPWATCHFile(capwatchPath, schema, session);

    const backend = backendGenerator(cliConf)(session.getSchema(cliConf.DB_SCHEMA));

    const inAccount = await backend.getAccount(accountID)
    if (Either.isLeft(inAccount)) {
        throw new Error(`importEventData: Account with ID ${accountID} does not exist.` + inAccount.value);
    }

    // Parse XLSX file
    const workbook = XLSX.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[1];
    const worksheet = workbook.Sheets[sheetName];
    const events: any[] = XLSX.utils.sheet_to_json(worksheet, {raw: true, header: 1, blankrows: false});

    console.log(`Recognized ${events.length} events from spreadsheet.`);
    // let rowCount = 0;
    var adminComments = '';

    const parseCadetUniforms = parseMultCheckbox(labels.CUniforms);
    const parseSeniorUniforms = parseMultCheckbox(labels.SMUniforms);
    const parseMeals = parseOtherMultCheckbox(labels.Meals);
    const parseLodgingArrangements = parseOtherMultCheckbox(labels.LodgingArrangments);
    const parseActivity = parseOtherMultCheckbox(labels.Activities);
    const parseRequiredForms = parseOtherMultCheckbox(labels.RequiredForms);
    const getEmptyString = Maybe.cata(() => '')((v: string) => v.trim())
    const lookupMembersByCAPID = async (capids: string[]): Promise<InternalPointOfContact[]> => Promise.all(
        capids
            .filter(id => !!id)
            .map(async (capidStr): Promise<InternalPointOfContact | null> => {
                if (!capidStr) return null;
                const capid = typeof capidStr === 'number' ? capidStr : parseInt(capidStr.trim(), 10);
                if (capid !== capid) return null;
                const member = await backend.getMember(inAccount.value)({ type: 'CAPNHQMember', id: capid });
                if (Either.isLeft(member)) { 
                    adminComments = 'POC CAPID ' + capid + ' is not valid. ';
                    return null; 
                }
                return {
                    email: getEmptyString(getMemberEmail(member.value.contact)),
                    memberReference: asReference(member.value),
                    phone: getEmptyString(getMemberPhone(member.value.contact)),
                    position: '',
                    publicDisplay: false,
                    receiveEventUpdates: true,
                    receiveRoster: true,
                    receiveSignUpUpdates: true,
                    receiveUpdates: true,
                    type: PointOfContactType.INTERNAL
                };
            })
    )
        .then((v) => v.filter((v): v is InternalPointOfContact => !!v));
    const lookupStatus = (statusStr: string): EventStatus => {
        const normalized = statusStr.trim().toLowerCase();
        switch (normalized) {
            case 'draft':
                return EventStatus.DRAFT;
            case 'tentative':
                return EventStatus.TENTATIVE;
            case 'confirmed':
                return EventStatus.CONFIRMED;
            case 'complete':
                return EventStatus.COMPLETE;
            case 'cancelled':
                return EventStatus.CANCELLED;
            default:
                return EventStatus.INFORMATIONONLY;
        }
    }

    for (const event of events.slice(2)) {
        if (event[0]) {
            counter++;
            console.log(`Processing event ${counter} of ${events.length}`);
            adminComments = '';
            // const smallEvent = event.slice(0, 38); // Limit to 38 columns
            // console.log(smallEvent);
            // console.log('M: ' + Math.round((((event[2]-25569)*86400)+14400)*1000) + ', ' + 
            // (new Date(Math.round((((event[2]-25569)*86400)+14400)*1000))) + ' S: ' +
            //     Math.round((((event[4]-25569)*86400)+14400)*1000) + ', ' + 
            //     (new Date(Math.round((((event[4]-25569)*86400)+14400)*1000))) + ' E: ' +
            //     Math.round((((event[6]-25569)*86400)+14400)*1000) + ', ' + 
            //     (new Date(Math.round((((event[6]-25569)*86400)+14400)*1000))) + ' P: ' +
            //     Math.round((((event[7]-25569)*86400)+14400)*1000) + ', ' +
            //     (new Date(Math.round((((event[7]-25569)*86400)+14400)*1000))))
            const InputEventObj: NewEventObject = {
                name: event[0],
                subtitle: event[1],
                meetDateTime: Math.round((((event[2]-25569)*86400)+14400)*1000),
                meetLocation: event[3],
                startDateTime: Math.round((((event[4]-25569)*86400)+14400)*1000),
                location: event[5],
                endDateTime: Math.round(((event[6]-25569)*86400)+14400)*1000,
                pickupDateTime: Math.round((((event[7]-25569)*86400)+14400)*1000),
                pickupLocation: event[8],
                transportationProvided: event[9] === "Y" ? true : false,
                transportationDescription: event[10] ? event[10] : '',
                comments: event[11],
                memberComments: event[12],
                activity: parseActivity(event[13]),
                lodgingArrangments: parseLodgingArrangements(event[14]),
                eventWebsite: event[15],
                highAdventureDescription: event[16],
                cuniform: parseCadetUniforms(event[17]),
                smuniform: parseSeniorUniforms(event[18]),
                requiredForms: parseRequiredForms(event[19]),
                acceptSignups: event[20] === 'Y' ? true : false,
                signUpDenyMessage: event[20] === 'Y' ? '' : event[21],
                mealsDescription: parseMeals(event[22]),
                requiredEquipment: [event[23], event[24], event[25], event[26]].filter((item: string | undefined) => item !== undefined && item !== '').map((item: string) => item.trim()),
                pointsOfContact: await lookupMembersByCAPID([event[27], event[28], event[29], event[30]]),
                desiredNumberOfParticipants: parseInt(event[31]) > 0 ? parseInt(event[31]) : 8,
                status: event[32] ? lookupStatus(event[32]) : EventStatus.CONFIRMED,
                complete: event[33] === 'Y' ? true : false,
                showUpcoming: event[34] === 'Y' ? true : false,
                administrationComments: !!adminComments ? adminComments + ' ' : + event[35] ? event[35].trim() : '',
                teamID: event[36]? parseInt(event[36]) : null,
                signUpPartTime: event[37] === 'Y' ? true : false,
                emailBody:  {
                    "value": { 
                        "body": "%%MEMBER_NAME%%, you are now signed up for event %%EVENT_NAME%% on %%START_DATE%%.\n\nSee [the event page here](%%EVENT_LINK%%) for complete event details."
                    },
                    "hasValue": true
                },
                groupEventNumber: {"labels": ["Not Required", "To Be Applied For", "Applied For"], "selection": 0, "otherValueSelected": false },
                regionEventNumber: {"labels": ["Not Required", "To Be Applied For", "Applied For"], "selection": 0, "otherValueSelected": false },
                customAttendanceFields: [],
                limitSignupsToTeam: false,
                fileIDs: [],
                privateAttendance: false,
            };
            await backend.createEvent(inAccount.value)(author)(InputEventObj);
        } else {
            // console.log('Skipping row with no event name.');
        }
    }

    console.log('\nImport complete.  Processed ' + counter + ' events.\n');
    process.exit();
})();