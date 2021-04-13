import { Trigger, TrustedUser } from '@mytypes/types';
import { TwitchIRCService } from '@services/twitchIRC';
import { container } from 'tsyringe';
import { DatabaseService } from '../../../src/services/mongoDB';
import { DatabaseStorageService } from '../../../src/services/storageService';
import { MockDatabase, getRes } from '../../../test';
import commands from './users.twitch';

describe('test db user commands(twitch)', () => {
	let service: DatabaseStorageService;
	let dbMock: DatabaseService;
	beforeAll(() => {
		container.registerSingleton(DatabaseStorageService);
		console.log = () => {};
		console.error = () => {};
	});
	beforeEach(() => {
		container.clearInstances();

		let mockedDatabase = (new MockDatabase() as unknown) as DatabaseService;
		container.registerInstance(DatabaseService, mockedDatabase);
		container.registerInstance(TwitchIRCService, ({
			client: {
				part: async () => {},
				join: async () => {},
			},
		} as unknown) as TwitchIRCService);
		service = container.resolve(DatabaseStorageService);
		dbMock = container.resolve(DatabaseService);
	});

	let cmdName = 'addToUser';
	it(`should run ${cmdName} command, with one user`, async () => {
		expect.assertions(4);

		let result = commands.find((x) => x.name === cmdName);
		expect(result).toBeTruthy();
		if (!result) return;

		const intialUser: TrustedUser = {
			name: 'user',
			counter: 0,
		};
		await service.updateGeneral('users', intialUser.name, intialUser, true);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(1);

		await getRes(result, `%${cmdName} ${intialUser.name}`, {});

		expect(service.data.users[0].counter).toBe(1);
		expect(updateSpy).toHaveBeenCalled();
	});

	it(`should run ${cmdName} command, with custom count`, async () => {
		expect.assertions(4);

		let result = commands.find((x) => x.name === cmdName);
		expect(result).toBeTruthy();
		if (!result) return;

		let count = 100;
		const intialUser: TrustedUser = {
			name: 'user',
			counter: 0,
		};
		await service.updateGeneral('users', intialUser.name, intialUser, true);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(1);

		await getRes(result, `%${cmdName} ${intialUser.name} ${count}`, {});

		expect(service.data.users[0].counter).toBe(intialUser.counter + count);
		expect(updateSpy).toHaveBeenCalled();
	});

	it(`should run ${cmdName} command, with negative count`, async () => {
		expect.assertions(4);

		let result = commands.find((x) => x.name === cmdName);
		expect(result).toBeTruthy();
		if (!result) return;

		let count = -100;
		const intialUser: TrustedUser = {
			name: 'user',
			counter: 0,
		};
		await service.updateGeneral('users', intialUser.name, intialUser, true);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(1);

		await getRes(result, `%${cmdName} ${intialUser.name} ${count}`, {});

		expect(service.data.users[0].counter).toBe(intialUser.counter + count);
		expect(updateSpy).toHaveBeenCalled();
	});

	let cmdName2 = 'counter';
	it(`should run ${cmdName2} command, with one user`, async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === cmdName2);
		expect(result).toBeTruthy();
		if (!result) return;

		const intialUser: TrustedUser = {
			name: 'user',
			counter: 1234,
		};
		await service.updateGeneral('users', intialUser.name, intialUser, true);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(1);

		const res = await getRes(result, `%${cmdName2} ${intialUser.name}`, {});

		expect(res).toMatch(intialUser.counter.toString());
		expect(res).toMatch(intialUser.name);
		expect(updateSpy).not.toHaveBeenCalled();
	});
	it(`should run ${cmdName2} command, with triggers`, async () => {
		expect.assertions(4);

		let result = commands.find((x) => x.name === cmdName2);
		expect(result).toBeTruthy();
		if (!result) return;

		let amt = 12;
		const intialTrigger: Trigger = {
			name: 'user',
			response: 'asd',
		};
		for (let i = 0; i < amt; i++) {
			await service.updateGeneral(
				'triggers',
				intialTrigger.name + i,
				intialTrigger,
				true,
			);
		}

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.triggers.length).toBe(amt);

		const res = await getRes(result, `%${cmdName2} triggers`, {});
		expect(res).toMatch(amt.toString());
		expect(updateSpy).not.toHaveBeenCalled();
	});
	it(`should run ${cmdName2} command, with no users`, async () => {
		expect.assertions(4);

		let result = commands.find((x) => x.name === cmdName2);
		expect(result).toBeTruthy();
		if (!result) return;

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(0);

		const res = await getRes(result, `%${cmdName2} randomname`, {});

		expect(res).toMatch('niet gevonden');
		expect(updateSpy).not.toHaveBeenCalled();
	});

	let cmdName3 = 'top';
	it(`should run ${cmdName3} command`, async () => {
		expect.assertions(5 + 3);

		let result = commands.find((x) => x.name === cmdName3);
		expect(result).toBeTruthy();
		if (!result) return;

		let amt = 12;
		const initialUser: TrustedUser = {
			name: 'user',
			counter: 10,
		};
		for (let i = 0; i < amt; i++) {
			await service.updateGeneral(
				'users',
				initialUser.name + i * amt, // Offset of name
				{
					...initialUser,
					counter: i,
				},
				true,
			);
		}

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(amt);

		const res = await getRes(result, `%${cmdName3}`, {});
		for (let i = amt - 5; i < amt; i++) {
			expect(res).toMatch(
				`${initialUser.name}${i * amt} zit op ${i.toString()}`,
			);
		}
		expect(updateSpy).not.toHaveBeenCalled();
	});

	let cmdName4 = 'trust';
	it(`should run ${cmdName4} command, with one user`, async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === cmdName4);
		expect(result).toBeTruthy();
		if (!result) return;

		const intialUser: TrustedUser = {
			name: 'user',
			counter: 0,
		};
		await service.updateGeneral('users', intialUser.name, intialUser, true);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.users.length).toBe(1);

		const res = await getRes(result, `%${cmdName4} ${intialUser.name}`, {});

		expect(service.data.users.length).toBe(1);

		expect(res).toMatch(`@${intialUser.name}`);
		expect(updateSpy).toHaveBeenCalled();
	});
	it(`should run ${cmdName4} command, with no user`, async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === cmdName4);
		expect(result).toBeTruthy();
		if (!result) return;

		let newName = 'randomname';

		const insertSpy = jest.spyOn(dbMock, 'insertOne');
		expect(service.data.users.length).toBe(0);

		const res = await getRes(result, `%${cmdName4} ${newName}`, {});

		expect(service.data.users.length).toBe(1);

		expect(res).toMatch(`@${newName}`);
		expect(insertSpy).toHaveBeenCalled();
	});

	let cmdName5 = 'untrust';
	it(`should run ${cmdName5} command, with one user`, async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === cmdName5);
		expect(result).toBeTruthy();
		if (!result) return;

		const intialUser: TrustedUser = {
			name: 'user',
			counter: 0,
		};
		await service.updateGeneral('users', intialUser.name, intialUser, true);

		const deleteSpy = jest.spyOn(dbMock, 'deleteOne');
		expect(service.data.users.length).toBe(1);

		const res = await getRes(result, `%${cmdName5} ${intialUser.name}`, {});

		expect(service.data.users.length).toBe(0);

		expect(res).toMatch(`@${intialUser.name}`);
		expect(deleteSpy).toHaveBeenCalled();
	});
	it(`should run ${cmdName5} command, with no user`, async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === cmdName5);
		expect(result).toBeTruthy();
		if (!result) return;

		let newName = 'randomname';

		const insertSpy = jest.spyOn(dbMock, 'insertOne');
		expect(service.data.users.length).toBe(0);

		const res = await getRes(result, `%${cmdName5} ${newName}`, {});

		expect(service.data.users.length).toBe(0);

		expect(res).toMatch(`fuck`);
		expect(insertSpy).not.toHaveBeenCalled();
	});
});
