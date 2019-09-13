import { Schema, Session } from '@mysql/xdevapi';
import { NHQ } from 'common-lib';
import { CAPWATCHImportErrors } from 'common-lib/index';
import { resolve } from 'path';
import conftest from '../../conf.test';
import Account from '../../lib/Account';
import ImportCAPWATCHFile from '../../lib/ImportCAPWATCHFile';
import { CAPNHQMember } from '../../lib/Members';
import { collectResults, findAndBind } from '../../lib/MySQLUtil';
import { getTestTools } from '../../lib/Util';

const zipFileLocation = resolve(__dirname, '../CAPWATCH.zip');

describe('Import CAPWATCH File', () => {
	let account: Account;
	let schema: Schema;
	let session: Session;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		account = results.account;
		schema = results.schema;
		session = results.session;

		done();
	});

	it('should only import specified files', async done => {
		const importFiles = ['Member.txt'];
		let resultCount = 0;

		for await (const _ of ImportCAPWATCHFile(zipFileLocation, schema, session, 916, importFiles)) {
			resultCount++;
		}

		expect(resultCount).toEqual(importFiles.length);

		done();
	});

	it('should log an error when an invalid file is passed', async done => {
		const errorStub = jest.spyOn(console, 'error');
		let resultCount = 0;

		for await (const _ of ImportCAPWATCHFile(zipFileLocation, schema, session, 916, ['notafile.txt'])) {
			resultCount++;
		}

		expect(resultCount).toEqual(0);

		expect(errorStub).toHaveBeenCalled();

		done();
	});

	it('should import Member.txt', async done => {
		for await (const i of ImportCAPWATCHFile(zipFileLocation, schema, session, 916, ['Member.txt'])) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const member = await CAPNHQMember.Get(542488, account, schema);

		expect(member.nameFirst).toBe('Andrew');

		done();
	});

	it('should import member contact information', async done => {
		for await (const i of ImportCAPWATCHFile(zipFileLocation, schema, session, 916, [
			'MbrContact.txt'
		])) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const results = await collectResults(
			findAndBind(schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact'), {
				CAPID: 542488
			})
		);

		const primaryEmail = results.filter(v => v.Type === 'EMAIL' && v.Priority === 'PRIMARY')[0];

		expect(primaryEmail.Contact).toBe('arioux.cap@gmail.com');

		done();
	}, 8000);

	it('should import cadet activity information', async done => {
		for await (const i of ImportCAPWATCHFile(zipFileLocation, schema, session, 916, [
			'CadetActivities.txt'
		])) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const results = await collectResults(
			findAndBind(schema.getCollection<NHQ.CadetActivities>('NHQ_CadetActivities'), {
				CAPID: 546319
			})
		);

		expect(results[0].Type).toBe('ENCAMP');
		expect(results[0].Location).toBe('Fort Devens');

		done();
	}, 15000);

	it('should import duty positions', async done => {
		for await (const i of ImportCAPWATCHFile(zipFileLocation, schema, session, 916, [
			'DutyPosition.txt'
		])) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const results = await collectResults(
			findAndBind(schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition'), {
				CAPID: 546319
			})
		);

		const result = results[0];

		expect(result.Duty).toBe('Testing Officer');

		done();
	});

	it('should import cadet duty positions', async done => {
		for await (const i of ImportCAPWATCHFile(zipFileLocation, schema, session, 916, [
			'CadetDutyPositions.txt'
		])) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const results = await collectResults(
			findAndBind(schema.getCollection<NHQ.DutyPosition>('NHQ_CadetDutyPosition'), {
				CAPID: 542488
			})
		);

		expect(results[0].Duty).toBe('Cadet Aerospace Education Officer');

		done();
	});
});
