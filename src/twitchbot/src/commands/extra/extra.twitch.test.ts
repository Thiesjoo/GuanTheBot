import { Trigger, TrustedUser } from '@mytypes/types';
import { TwitchIRCService } from '@services/twitchIRC';
import { container } from 'tsyringe';
import { DatabaseService } from '../../../src/services/mongoDB';
import { DatabaseStorageService } from '../../../src/services/storageService';
import { MockDatabase, getRes } from '../../../test';
import commands from './extra.twitch';

describe('test extra user commands(twitch)', () => {
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

	let cmdName = 'hug';
	it(`should run ${cmdName} command, with lowercase o`, async () => {
		expect.assertions(2);

		let result = commands.find((x) => x.name === cmdName);
		expect(result).toBeTruthy();
		if (!result) return;

		let input = 'testing 123';
		let res = await getRes(result, `%${cmdName} ${input}`, {});

		expect(res).toMatch(input);
	});

	let cmdName2 = 'omega';

	test.each(['oo', 'OO'])(
		`should run ${cmdName2} command, with %s`,
		async (input) => {
			expect.assertions(2);
			let result = commands.find((x) => x.name === cmdName2);
			expect(result).toBeTruthy();
			if (!result) return;

			let res = await getRes(result, `%${cmdName2} ${input}`, {});

			expect(res).toBe(' OMEGALUL  OMEGALUL ');
		},
	);
});
