#!/usr/local/bin/node --no-warnings
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

import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { PAM, conf } from 'server-common';
import { getCAPWATCHTestData, setPresetRecordsSchema } from 'server-jest-config';
import { AccountType, Maybe } from 'common-lib';
import { getSession } from '@mysql/xdevapi';

process.on('unhandledRejection', up => {
	throw up;
});

const promisedRandomBytes = promisify(randomBytes);

void (async () => {
    console.log('Waiting for dev database to come up...');

    const config = await conf.getCLIConfiguration();

    let session = null;

    do {
        try {
            session = await getSession({
                host: config.DB_HOST,
                password: config.DB_PASSWORD,
                port: config.DB_PORT,
                user: config.DB_USER
            });
        } catch (e) {
            console.log(e);
            await new Promise(res => setTimeout(res, 1000));
        }
    } while (session == null);

    const schema = session.getSchema(config.DB_SCHEMA);

    const records = getCAPWATCHTestData();

	const salt = (await promisedRandomBytes(PAM.DEFAULT_SALT_SIZE)).toString('hex');

    console.log('Setting up preset database...');

    await setPresetRecordsSchema({
        ...records,
        NHQ_Member: [
            ...records.NHQ_Member,
            {
                CAPID: 542488, // must be Rioux for super admin
                CdtWaiver: '',
                Citizen: 'US Citizen',
                DateMod: new Date().toISOString(),
                DOB: new Date().toISOString(),
                EducationLevel: '6',
                Expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
                Gender: 'MALE',
                Joined: new Date().toISOString(),
                LSCode: 'A',
                MbrStatus: 'ACTIVE',
                NameFirst: 'Test',
                NameLast: 'Testerson',
                NameMiddle: '',
                NameSuffix: '',
                ORGID: 916,
                OrgJoined: new Date().toISOString(),
                PicDate: new Date().toISOString(),
                PicStatus: 'VALIDATED',
                Profession: 'Information Technology',
                Rank: 'SM',
                RankDate: new Date().toISOString(),
                Region: 'MAR',
                SSN: '',
                Type: 'SENIOR',
                Unit: '089',
                UsrID: 'riouxad',
                Wing: 'MD'
            }
        ],
        UserAccountInfo: [
            {
                member: {
                    type: 'CAPNHQMember',
                    id: 542488
                },
                // password is 'testpassword'
                passwordHistory: [
                    {
                        created: Date.now(),
                        iterations: PAM.DEFAULT_PASSWORD_ITERATION_COUNT,
                        salt,
                        algorithm: PAM.PASSWORD_NEW_ALGORITHM,
                        password: (await PAM.hashPassword(
                            'testpassword',
                            salt,
                            PAM.PASSWORD_NEW_ALGORITHM
                        )).toString('hex')
                    }
                ],
                username: 'testadmin'
            }
        ],
        Accounts: [
            {
                type: AccountType.CAPSQUADRON,
                aliases: ['stmarys'],
                comments: '',
                discordServer: Maybe.none(),
                id: 'md089',
                mainCalendarID: '',
                mainOrg: 916,
                orgIDs: [916],
                parentGroup: Maybe.none(),
                parentWing: Maybe.none()
            }
        ],
        Registry: [
            {
                accountID: 'md089',
                Contact: {
                    Discord: null,
                    FaceBook: null,
                    Flickr: null,
                    Instagram: null,
                    LinkedIn: null,
                    MailingAddress: null,
                    MeetingAddress: null,
                    Twitter: null,
                    YouTube: null
                },
                id: 'md089',
                RankAndFile: {
                    Flights: ['Alpha', 'Bravo', 'Charlie']
                },
                Website: {
                    FaviconID: Maybe.none(),
                    Name: "CAP St. Marys",
                    PhotoLibraryImagesPerPage: 50,
                    Separator: '-',
                    ShowUpcomingEventCount: 7,
                    Timezone: 'America/New_York',
                    UnitName: 'CAP St. Marys'
                }
            }
        ]
    })(schema);

    console.log('Done!');

    process.exit();
})();