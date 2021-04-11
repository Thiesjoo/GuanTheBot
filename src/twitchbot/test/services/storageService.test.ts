import 'reflect-metadata';
import { container } from 'tsyringe';
import { ObjectConstructor } from '../../src/@types/object';

import { DatabaseService } from '../../src/services/mongoDB';

import { DBStorageService } from '../../src/services/storageService';
import { MockDatabase } from './dbMock';

describe('test storageService', () => {
	let service: DBStorageService;
	let dbMock: DatabaseService;
	beforeAll(() => {
		container.registerSingleton(DBStorageService);
	});
	beforeEach(() => {
		container.clearInstances();

		let mockedDatabase = (new MockDatabase() as unknown) as DatabaseService;
		container.registerInstance(DatabaseService, mockedDatabase);
		service = container.resolve(DBStorageService);
		dbMock = container.resolve(DatabaseService);
	});
	it('service should be initialized', () => {
		let service = container.resolve(DBStorageService);
		service.data.listening.push({ name: 'truasd' });
		expect(service).toBeTruthy();
	});
	it('initial data should have a length of 0', () => {
		let service = container.resolve(DBStorageService);
		(Object as ObjectConstructor).keys(service.data).forEach((x) => {
			expect(service.data[x].length).toBe(0);
		});
	});
	it('initial data from DB should have a length of 0 (updateAll)', async () => {
		let service = container.resolve(DBStorageService);
		expect.assertions(Object.keys(service.data).length);

		await service.updateAll();

		// expect(
		// 	DatabaseService.mock.instances[0].getAllTriggers,
		// ).toHaveBeenCalledTimes(5);

		(Object as ObjectConstructor).keys(service.data).forEach((x) => {
			expect(service.data[x].length).toBe(0);
		});
	});
	it('should add a general item', async () => {
		expect.assertions(4);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');

		const collection = 'triggers';
		const name = 'asd';
		const obj = { lmao: 'asd' };

		const res = await service.updateGeneral(collection, name, obj, true);
		// New object in store
		expect(service.data.triggers.length).toBe(1);

		// New object in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(
			collection,
			{
				name,
			},
			{ $set: obj },
			true,
		);

		expect(res.upsertedCount).toBe(1);
	});
	it('should update a general item', async () => {
		expect.assertions(6);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');

		const collection = 'triggers';
		const name = 'initial trigger';
		const obj = { key: 'updated value' };

		service.data[collection] = [
			{
				name,
				key: 'initial value',
			},
		];

		expect(service.data.triggers.length).toBe(1);

		const res = await service.updateGeneral(collection, name, obj, false);
		// Updated object in store
		expect(service.data.triggers.length).toBe(1);
		expect(service.data.triggers[0].key).toBe(obj.key);

		// New Updated in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(
			collection,
			{
				name,
			},
			{ $set: obj },
			false,
		);

		expect(res.upsertedCount).toBe(0);
	});
	it('should upsert a general item', async () => {
		expect.assertions(6);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');

		const collection = 'triggers';
		const name = 'initial trigger';

		expect(service.data.triggers.length).toBe(0);

		const res = await service.updateGeneral(
			collection,
			name,
			{
				name,
				key: 'initial value',
			},
			true,
		);
		// Updated object in store
		expect(service.data.triggers.length).toBe(1);
		expect(service.data.triggers[0].key).toBe('initial value');

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
					key: 'initial value',
				},
			},
			true,
		);

		expect(res.upsertedCount).toBe(1);
	});
	it('should delete a general item', async () => {
		expect.assertions(4);

		const deleteSpy = jest.spyOn(dbMock, 'deleteOne');

		const collection = 'triggers';
		const name = 'name';

		service.data[collection] = [
			{
				name,
				key: 'initial value',
			},
		];

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

		const name = 'initial user';

		service.data.users = [
			{
				name,
				counter: 0,
			},
		];

		expect(service.data.users.length).toBe(1);

		const res = await service.increaseUser(name, 1);
		expect(res).toBe(true);
		// New object in store
		expect(service.data.users.length).toBe(1);
		expect(service.data.users[0].counter).toBe(1);

		// New object in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(
			'users',
			{
				name,
			},
			{
				$inc: {
					counter: 1,
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

		const name = 'initial command';

		service.data.commands = [
			{
				name,
				counter: 0,
			},
		];

		expect(service.data.commands.length).toBe(1);

		const res = await service.increaseCommandCounter(name, 1);
		expect(res).toBe(true);
		// New object in store
		expect(service.data.commands.length).toBe(1);
		expect(service.data.commands[0].counter).toBe(1);

		// New object in database
		expect(updateSpy).toHaveBeenCalled();
		expect(updateSpy).toHaveBeenCalledWith(
			'commands',
			{
				name,
			},
			{
				$inc: {
					counter: 1,
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
