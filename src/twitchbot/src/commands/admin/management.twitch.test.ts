import { Trigger, TrustedUser } from '@mytypes/types';
import { TwitchIRCService } from '@services/twitchIRC';
import { container } from 'tsyringe';
import { Collections, DatabaseService } from '../../../src/services/mongoDB';
import { DatabaseStorageService } from '../../../src/services/storageService';
import { MockDatabase, getRes } from '../../../test';
import commands from './management.twitch';

describe('test management commands(twitch)', () => {
	let service: DatabaseStorageService;
	let dbMock: DatabaseService;
	beforeAll(() => {
		container.registerSingleton(DatabaseStorageService);
		console.error = () => {};
		console.log = () => {};
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

	test.each([
		['addreaction', 'reactions', false],
		['addcmd', 'commands', false],
		['addtrigger', 'triggers', false],
		['addtrigger', 'triggers', true],
	])(
		`should run %s command, with no existing %s, empty response=%s`,
		async (cmdName, _col: string, trigger = false) => {
			let col = (_col as keyof Collections) as
				| 'reactions'
				| 'commands'
				| 'triggers';
			expect.assertions(5);

			let result = commands.find((x) => x.name === cmdName);
			expect(result).toBeTruthy();
			if (!result) return;

			expect(service.data[col].length).toBe(0);

			let name = 'name';
			let input = trigger ? '' : 'reaction lmao';
			let res = await getRes(result, `%${cmdName} ${name} ${input}`, {});

			expect(service.data[col].length).toBe(1);
			trigger && expect(service.data[col][0].response).toBeFalsy();
			!trigger && expect(service.data[col][0].response).toBe(input);

			expect(res).toMatch(col);
		},
	);

	test.each([
		['addreaction', 'reactions', false],
		['addcmd', 'commands', false],
		['addtrigger', 'triggers', false],
		['addtrigger', 'triggers', true],
	])(
		`should run %s command, with existing %s, empty response=%s`,
		async (cmdName, _col: string, trigger = false) => {
			let col = (_col as keyof Collections) as
				| 'reactions'
				| 'commands'
				| 'triggers';
			expect.assertions(5);

			let result = commands.find((x) => x.name === cmdName);
			expect(result).toBeTruthy();
			if (!result) return;

			let name = 'name';
			let input = trigger ? '' : 'updated input';

			await service.updateGeneral(
				col,
				name,
				{
					name,
					response: 'initial input',
				},
				true,
			);

			expect(service.data[col].length).toBe(1);

			let res = await getRes(result, `%${cmdName} ${name} ${input}`, {});

			expect(service.data[col].length).toBe(1);
			trigger && expect(service.data[col][0].response).toBeFalsy();
			!trigger && expect(service.data[col][0].response).toBe(input);

			expect(res).toMatch(col);
		},
	);

	test.each([
		['delreaction', 'reactions', false],
		['delcmd', 'commands', false],
		['deltrigger', 'triggers', false],
		['delreaction', 'reactions', true],
		['delcmd', 'commands', true],
		['deltrigger', 'triggers', true],
	])(
		`should run %s command, with %s, with existing = %s`,
		async (cmdName, _col: string, existing = true) => {
			let col = (_col as keyof Collections) as 'reactions' | 'commands';
			expect.assertions(4);

			let result = commands.find((x) => x.name === cmdName);
			expect(result).toBeTruthy();
			if (!result) return;

			let name = 'name';

			if (existing)
				await service.updateGeneral(
					col,
					name,
					{
						name,
						response: 'initial input',
					},
					true,
				);

			expect(service.data[col].length).toBe(+existing);

			let res = await getRes(result, `%${cmdName} ${name} `, {});

			expect(service.data[col].length).toBe(0);

			expect(res).toMatch(existing ? col : 'failed');
		},
	);
});
