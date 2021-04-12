import 'reflect-metadata';
import { container } from 'tsyringe';
import { ObjectConstructor } from '../../src/@types/object';
import { Command, Trigger, TrustedUser } from '../../src/@types/types';

import { DatabaseService } from '../../src/services/mongoDB';

import { DatabaseStorageService } from '../../src/services/storageService';
import { MockDatabase } from '../MOCKS/dbMock';

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

describe('test storageService', () => {
	let service: DatabaseStorageService;
	let dbMock: DatabaseService;
	beforeAll(() => {
		container.registerSingleton(DatabaseStorageService);
	});
	beforeEach(() => {
		container.clearInstances();

		let mockedDatabase = (new MockDatabase() as unknown) as DatabaseService;
		container.registerInstance(DatabaseService, mockedDatabase);
		service = container.resolve(DatabaseStorageService);
		dbMock = container.resolve(DatabaseService);
	});
	it('service should be initialized', () => {
		let service = container.resolve(DatabaseStorageService);
		service.data.listening.push({ name: 'truasd' });
		expect(service).toBeTruthy();
	});
	it('initial data should have a length of 0', () => {
		let service = container.resolve(DatabaseStorageService);
		(Object as ObjectConstructor).keys(service.data).forEach((x) => {
			expect(service.data[x].length).toBe(0);
		});
	});
	it('initial data from DB should have a length of 0 (updateAll)', async () => {
		let service = container.resolve(DatabaseStorageService);
		expect.assertions(Object.keys(service.data).length);

		await service.updateAll();

		(Object as ObjectConstructor).keys(service.data).forEach((x) => {
			expect(service.data[x].length).toBe(0);
		});
	});
	it('should add a general item', async () => {
		expect.assertions(5);

		const updateSpy = jest.spyOn(dbMock, 'insertOne');

		const collection = 'triggers';
		const name = 'asd';
		const obj = { response: 'test ' };
		const res = await service.updateGeneral(collection, name, obj, true);

		// New object in store
		expect(service.data[collection].length).toBe(1);
		expect(res).toBeTruthy();

		// New object in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(collection, {
			name,
			...obj,
		});

		expect(res).toMatchObject({
			name,
			...obj,
		});
	});
	it('should update a general item', async () => {
		expect.assertions(6);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');

		const collection = 'triggers';
		const name = 'initial trigger';
		const objToBeUpdated = { response: 'updated value' };

		const fullItem: Trigger = {
			name,
			response: 'initial value',
		};

		//Initialization
		await service.updateGeneral(collection, name, fullItem, true);
		expect(service.data.triggers.length).toBe(1);

		// The real updating
		const res = await service.updateGeneral(
			collection,
			name,
			objToBeUpdated,
			false,
		);
		// Updated object in store
		expect(service.data.triggers.length).toBe(1);
		expect(service.data.triggers[0].response).toBe(objToBeUpdated.response);

		// New Updated in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(
			collection,
			{
				name,
			},
			{
				$set: {
					name,
					...objToBeUpdated,
				},
			},
		);

		expect(res).toMatchObject({
			...fullItem,
			...objToBeUpdated,
		});
	});
	it('should upsert a general item', async () => {
		expect.assertions(5);

		const updateSpy = jest.spyOn(dbMock, 'insertOne');

		const collection = 'triggers';

		const toBeUpserted = {
			name: 'initial trigger',
			key: 'initial value',
		};
		const name = toBeUpserted.name;

		expect(service.data.triggers.length).toBe(0);

		const res = await service.updateGeneral(
			collection,
			name,
			toBeUpserted,
			true,
		);
		// Updated object in store
		expect(service.data.triggers.length).toBe(1);

		// Values
		expect(service.data.triggers[0]).toMatchObject(toBeUpserted);
		expect(res).toMatchObject(toBeUpserted);

		// New Updated in database
		expect(updateSpy).toHaveBeenCalled();
	});
	it('should delete a general item', async () => {
		expect.assertions(4);

		const deleteSpy = jest.spyOn(dbMock, 'deleteOne');

		const collection = 'triggers';
		const toBeUpserted: Trigger = {
			name: 'initial trigger',
			response: 'initial value',
		};
		const name = toBeUpserted.name;

		service.data[collection] = [toBeUpserted];

		expect(service.data.triggers.length).toBe(1);

		await service.deleteGeneral(collection, name);
		// No object in store
		expect(service.data.triggers.length).toBe(0);

		// New object in database
		expect(deleteSpy).toHaveBeenCalled();
		expect(deleteSpy).toHaveBeenCalledWith(collection, {
			name,
		});
	});
	it('should increase user by one', async () => {
		expect.assertions(6);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');

		const initialUser: TrustedUser = {
			name: 'initial user',
			counter: 0,
		};
		const name = initialUser.name;

		//Initialization
		await service.updateGeneral('users', name, initialUser, true);
		expect(service.data.users.length).toBe(1);

		//Incrase
		const res = await service.increaseUser(name, 10);
		expect(res).toBe(true);
		// New object in store
		expect(service.data.users.length).toBe(1);
		expect(service.data.users[0].counter).toBe(10);

		// New object in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(
			'users',
			{
				name,
			},
			{
				$inc: {
					counter: 10,
				},
			},
		);
	});
	it('should fail to increase user counter when user doesnt exist', async () => {
		expect.assertions(4);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(0);

		const res = await service.increaseUser('user', 1);
		expect(res).toBe(false);
		expect(service.data.users.length).toBe(0);
		expect(updateSpy).toHaveBeenCalledTimes(0);
	});
	it('should increase command counter by one', async () => {
		expect.assertions(6);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');

		const toBeUpserted: Command = {
			name: 'initial command',
			counter: 0,
			response: 'sample response',
		};
		const name = toBeUpserted.name;
		await service.updateGeneral('commands', name, toBeUpserted, true);

		service.data.commands = [toBeUpserted];

		expect(service.data.commands.length).toBe(1);

		const increaseAmount = 10;

		const res = await service.increaseCommandCounter(name, increaseAmount);
		expect(res).toBe(true);
		// New object in store
		expect(service.data.commands.length).toBe(1);
		expect(service.data.commands[0].counter).toBe(increaseAmount);

		// New object in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(
			'commands',
			{
				name,
			},
			{
				$inc: {
					counter: increaseAmount,
				},
			},
		);
	});
	it('should fail to increase command counter when command doesnt exist', async () => {
		expect.assertions(4);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.commands.length).toBe(0);

		const res = await service.increaseCommandCounter('name', 1);
		expect(res).toBe(false);
		expect(service.data.commands.length).toBe(0);
		expect(updateSpy).toHaveBeenCalledTimes(0);
	});
});
