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
		container.registerInstance(TwitchIRCService, null);
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
		console.log(cmdResult);
		// Included name
		expect(cmdResult).toMatch(`${toBeUpserted.name}`);
		expect(service.data.commands.length).toBe(1);
		expect(service.data.commands[0].counter).toBe(newCount);
	});

	test.todo('listen command should work');
	test.todo('listen (LURK) command should work');
	test.todo('unlisten command should work');
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
