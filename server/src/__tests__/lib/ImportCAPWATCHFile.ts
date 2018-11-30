import { Schema } from '@mysql/xdevapi';
import { resolve } from 'path';
import conftest from '../../conf.test';
import { CAPWATCHImportErrors } from '../../enums';
import Account from '../../lib/Account';
import ImportCAPWATCHFile from '../../lib/ImportCAPWATCHFile';
import { CAPWATCHMember } from '../../lib/Members';
import { collectResults, findAndBind } from '../../lib/MySQLUtil';
import { getTestTools } from '../../lib/Util';

const zipFileLocation = resolve(__dirname, '../CAPWATCH.zip');

describe('Import CAPWATCH File', () => {
	let account: Account;
	let schema: Schema;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		account = results.account;
		schema = results.schema;

		done();
	});

	it('should only import specified files', async done => {
		const importFiles = ['Member.txt'];
		let resultCount = 0;

		for await (const i of ImportCAPWATCHFile(
			zipFileLocation,
			schema,
			916,
			importFiles
		)) {
			resultCount++;
		}

		expect(resultCount).toEqual(importFiles.length);

		done();
	});

	it('should log an error when an invalid file is passed', async done => {
		const errorStub = jest.spyOn(console, 'error');
		let resultCount = 0;

		for await (const i of ImportCAPWATCHFile(
			zipFileLocation,
			schema,
			916,
			['notafile.txt']
		)) {
			resultCount++;
		}

		expect(resultCount).toEqual(0);

		expect(errorStub).toHaveBeenCalled();

		done();
	});

	it('should import Member.txt', async done => {
		for await (const i of ImportCAPWATCHFile(
			zipFileLocation,
			schema,
			916,
			['Member.txt']
		)) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const member = await CAPWATCHMember.Get(542488, account, schema);

		expect(member.nameFirst).toBe('Andrew');

		done();
	});

	it('should import member contact information', async done => {
		for await (const i of ImportCAPWATCHFile(
			zipFileLocation,
			schema,
			916,
			['MbrContact.txt']
		)) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const results = await collectResults(
			findAndBind(
				schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact'),
				{
					CAPID: 542488
				}
			)
		);

		const primaryEmail = results.filter(
			v => v.Type === 'EMAIL' && v.Priority === 'PRIMARY'
		)[0];

		expect(primaryEmail.Contact).toBe('arioux.cap@gmail.com');

		done();
	}, 8000);

	it('should import duty positions', async done => {
		for await (const i of ImportCAPWATCHFile(
			zipFileLocation,
			schema,
			916,
			['DutyPosition.txt']
		)) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const results = await collectResults(
			findAndBind(
				schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition'),
				{
					CAPID: 546319
				}
			)
		);

		expect(results[0].Duty).toBe('Testing Officer');

		done();
	});

	it('should import cadet duty positions', async done => {
		for await (const i of ImportCAPWATCHFile(
			zipFileLocation,
			schema,
			916,
			['CadetDutyPositions.txt']
		)) {
			expect(i.error).toBe(CAPWATCHImportErrors.NONE);
		}

		const results = await collectResults(
			findAndBind(
				schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition'),
				{
					CAPID: 542488
				}
			)
		);

		expect(results[0].Duty).toBe('Cadet Aerospace Education Officer');

		done();
	});
});
