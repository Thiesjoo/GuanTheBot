import { TwitchIRCService } from '@services/twitchIRC';
import { container } from 'tsyringe';
import { DatabaseService } from '../services/mongoDB';
import { DatabaseStorageService } from '../services/storageService';
import { MockDatabase } from '../../test';
import { parseCommand, ParseCommandResult } from './parseCommands';
import { ChatUserstate } from 'tmi.js';

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

	test.each([
		[
			'return message',
			'message',
			{},
			{
				message: '%message',
			},
		],
		[
			'parse command correctly',
			'cmd',
			{},
			{
				command: 'cmd',
			},
		],
		[
			'parse first arg correctly',
			'cmd firstArg',
			{},
			{
				firstArg: 'firstArg',
			},
		],
		[
			'parse all the args correctly',
			'cmd firstArg rest of args',
			{},
			{
				fullArgs: 'firstArg rest of args',
			},
		],
		[
			'parse all the args, without first args, correctly',
			'cmd firstArg rest of args',
			{},
			{
				args: 'rest of args',
			},
		],
		[
			'parse username, when provided, correctly',
			'cmd myuser',
			{
				username: 'notmyuser',
			},
			{
				taggedUsername: 'myuser',
			},
		],
		[
			'parse username, when provided with @, correctly',
			'cmd myuser',
			{
				username: 'notmyuser',
			},
			{
				taggedUsername: 'myuser',
			},
		],
		[
			'parse username, when not provided, correctly',
			'cmd',
			{
				username: 'notmyuser',
			},
			{
				taggedUsername: 'notmyuser',
			},
		],
	])(
		`should %s, with message %p and userstate: %O, result should be %O`,
		(
			_testDesc: string,
			input: string,
			state: { username?: string },
			endResult: ParseCommandResult,
		) => {
			let res = parseCommand('%' + input, state);

			Object.entries(endResult).forEach(
				//@ts-ignore
				(x: [keyof ParseCommandResult, string]) => {
					expect(x[0]).toBeTruthy();
					if (x[0] === undefined) return;
					expect(res[x[0]]).toBe(x[1]);
				},
			);
		},
	);
});
