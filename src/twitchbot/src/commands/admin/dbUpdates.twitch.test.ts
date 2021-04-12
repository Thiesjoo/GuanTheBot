import { Command } from '@mytypes/types';
import { TwitchIRCService } from '@services/twitchIRC';
import { ChatUserstate } from 'tmi.js';
import { container } from 'tsyringe';
import { DatabaseService } from '../../../src/services/mongoDB';
import { DatabaseStorageService } from '../../../src/services/storageService';
import { MockDatabase } from '../../../test/dbMock';
jest.mock('@services/twitchIRC');
import commands from './dbUpdates.twitch';

describe('test db discord commands', () => {
	let service: DatabaseStorageService;
	let dbMock: DatabaseService;
	beforeAll(() => {
		container.registerSingleton(DatabaseStorageService);
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

	let cmdName = 'cmdcounter';

	it(`should run "${cmdName}" command`, async () => {
		expect.assertions(4);

		let result = commands.find((x) => x.name === cmdName);
		expect(result).toBeTruthy();
		if (!result) return;

		const toBeUpserted = {
			name: 'initial_command',
			counter: 1234,
			response: 'sample response',
		};
		const name = toBeUpserted.name;
		await service.updateGeneral('commands', name, toBeUpserted, true);

		expect(service.data.commands.length).toBe(1);

		let cmdResult = await getRes(
			result,
			`%${cmdName} ${toBeUpserted.name}`,
			{},
		);
		// Include count
		expect(cmdResult).toMatch(`${toBeUpserted.counter}`);
		// Included name
		expect(cmdResult).toMatch(`${toBeUpserted.name}`);
	});

	let cmdName2 = 'setcmdcounter';
	it(`should run "${cmdName}" command`, async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === cmdName2);
		expect(result).toBeTruthy();
		if (!result) return;

		let newCount = 4321;

		const toBeUpserted = {
			name: 'initial_command',
			counter: 1234,
			response: 'sample response',
		};
		const name = toBeUpserted.name;
		await service.updateGeneral('commands', name, toBeUpserted, true);

		expect(service.data.commands.length).toBe(1);

		let cmdResult = await getRes(
			result,
			`%${cmdName2} ${toBeUpserted.name} ${newCount}`,
			{},
		);
		// Included name
		expect(cmdResult).toMatch(`${toBeUpserted.name}`);
		expect(service.data.commands.length).toBe(1);
		expect(service.data.commands[0].counter).toBe(newCount);
	});

	it('listen command should work', async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === 'listen');
		expect(result).toBeTruthy();
		if (!result) return;

		const insertSpy = jest.spyOn(dbMock, 'insertOne');

		const toBeListening = {
			name: 'initial_listener',
			lurk: false,
		};

		expect(service.data.listening.length).toBe(0);

		await getRes(result, `%listen ${toBeListening.name}`, {});
		// Included name
		expect(service.data.listening.length).toBe(1);
		expect(service.data.listening[0].lurk).toBe(false);
		expect(insertSpy).toHaveBeenCalledWith('listening', toBeListening);
	});
	it('listen (LURK) command should work', async () => {
		expect.assertions(6);

		let result = commands.find((x) => x.name === 'listen');
		expect(result).toBeTruthy();
		if (!result) return;

		const insertSpy = jest.spyOn(dbMock, 'insertOne');

		const toBeListening = {
			name: 'initial_listener',
			lurk: true,
		};

		expect(service.data.listening.length).toBe(0);

		await getRes(result, `%listen ${toBeListening.name} true`, {});
		// Included name
		expect(service.data.listening.length).toBe(1);
		expect(service.data.listening[0].lurk).toBe(true);
		expect(insertSpy).toHaveBeenCalled();
		expect(insertSpy).toHaveBeenCalledWith('listening', toBeListening);
	});
	it('listen (LURK) command should update existing listener', async () => {
		expect.assertions(5);

		let result = commands.find((x) => x.name === 'listen');
		expect(result).toBeTruthy();
		if (!result) return;

		const toBeListening = {
			name: 'initial_listener',
			lurk: false,
		};

		await service.updateGeneral(
			'listening',
			toBeListening.name,
			toBeListening,
			true,
		);

		const updateSpy = jest.spyOn(dbMock, 'updateOne');
		expect(service.data.listening.length).toBe(1);

		await getRes(result, `%listen ${toBeListening.name} true`, {});
		// Included name
		expect(service.data.listening.length).toBe(1);
		expect(service.data.listening[0].lurk).toBe(true);
		expect(updateSpy).toHaveBeenCalled();
	});

	it('unlisten command should work', async () => {
		expect.assertions(4);

		let result = commands.find((x) => x.name === 'unlisten');
		expect(result).toBeTruthy();
		if (!result) return;

		const deleteSpy = jest.spyOn(dbMock, 'deleteOne');

		const toBeListening = {
			name: 'initiallistener',
			lurk: false,
		};

		await service.updateGeneral(
			'listening',
			toBeListening.name,
			toBeListening,
			true,
		);
		expect(service.data.listening.length).toBe(1);

		await getRes(result, `%unlisten ${toBeListening.name}`, {});

		// Included name
		expect(service.data.listening.length).toBe(0);
		expect(deleteSpy).toHaveBeenCalled();
	});
});

async function getRes(
	result: Command,
	msg: string,
	userState: ChatUserstate = {},
) {
	return typeof result.response === 'string'
		? result.response
		: typeof result.response === 'function'
		? await result.response(msg, userState)
		: '';
}
