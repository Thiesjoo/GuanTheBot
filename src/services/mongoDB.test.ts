import { MockDatabase } from '../../test/dbMock';
import { container } from 'tsyringe';
import { DatabaseStorageService } from './storageService';

describe('test dbmock', () => {
	let dbMock: MockDatabase;
	beforeAll(() => {
		container.registerSingleton(DatabaseStorageService);
	});
	beforeEach(() => {
		container.clearInstances();

		dbMock = new MockDatabase();
	});

	it('should insert objects correcly', async () => {
		expect.assertions(2);
		const colName = 'triggers';
		expect(dbMock.localCache[colName]).toBeFalsy();
		await dbMock.insertOne(colName, {
			name: 'asd',
		});

		expect(dbMock.localCache[colName].length).toBe(1);
	});

	it('should update objects correctly ($set)', async () => {
		expect.assertions(4);

		const colName = 'triggers';
		const key = 'key';
		const name = 'name';

		await dbMock.insertOne(colName, {
			name,
			[key]: 'initial value',
		});

		expect(dbMock.localCache[colName].length).toBe(1);

		const updateValue = 'updated value';
		await dbMock.updateOne(
			colName,
			{
				name,
			},
			{
				$set: {
					[key]: updateValue,
				},
			},
		);

		expect(dbMock.localCache[colName].length).toBe(1);
		expect(dbMock.localCache[colName][0]).toBeTruthy();
		expect(dbMock.localCache[colName][0][key]).toBe(updateValue);
	});

	it('should update objects correctly ($inc)', async () => {
		expect.assertions(4);

		const colName = 'triggers';
		const key = 'counter';
		const name = 'name';

		const initialValue = 1;

		await dbMock.insertOne(colName, {
			name,
			[key]: initialValue,
		});

		expect(dbMock.localCache[colName].length).toBe(1);

		const updateValue = 10;
		await dbMock.updateOne(
			colName,
			{
				name,
			},
			{
				$inc: {
					[key]: updateValue,
				},
			},
		);

		expect(dbMock.localCache[colName].length).toBe(1);
		expect(dbMock.localCache[colName][0]).toBeTruthy();
		expect(dbMock.localCache[colName][0][key]).toBe(updateValue + initialValue);
	});
});
