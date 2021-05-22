import { CommandOptionType } from '@mytypes/discord_extra';
import { Command } from '@mytypes/types';
import { DatabaseStorageService } from '@services/storageService';
import { container } from 'tsyringe';
import { parseCommand } from '../parseCommands';

const commands: Command[] = [
	{
		name: 'addToUser',
		admin: true,
		reaction: false,
		response: async (message, userState) => {
			const { taggedUsername, args } = parseCommand(message, userState);
			if (!taggedUsername) {
				console.error('No tagged username', message);
				return;
			}
			const storage = container.resolve(DatabaseStorageService);
			let res = await storage.increaseUser(taggedUsername, +args || 1);
			if (!res) {
				console.error('Message failed: ', taggedUsername);
			}
			return;
		},

		description: "Add typo's to user",
		options: [
			{
				name: 'user',
				description: 'User to add to, lowercase',
				type: CommandOptionType.STRING,
				required: true,
			},
			{
				name: 'amount',
				description: 'Amount to add/subtract',
				type: CommandOptionType.INTEGER,
				required: true,
			},
		],
	},
	{
		name: 'counter',
		reaction: false,
		response: async (message, userState) => {
			const { taggedUsername } = parseCommand(message, userState);
			const storage = container.resolve(DatabaseStorageService);

			let user = storage.data.users.find(
				(x) => x.name === taggedUsername.toLowerCase(),
			);
			if (!user) {
				return 'Die gebruiker is niet gevonden';
			}
			return `${taggedUsername} heeft nu al ${user.counter} keer iets verkeerd getypdt`;
		},
		description: "Get current typo's of user",
		options: [
			{
				name: 'user',
				description: 'User to add to, lowercase',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'triggers',
		reaction: false,
		response: async (message, userState) => {
			const storage = container.resolve(DatabaseStorageService);

			return `Er zijn nu al ${storage.data.triggers.length} triggers in de database`;
		},
		description: 'Get amount of triggers in db',
	},
	{
		name: 'top',
		reaction: false,
		response: () => {
			const storage = container.resolve(DatabaseStorageService);
			storage.data.users.sort((a, b) => b.counter - a.counter);
			return storage.data.users.reduce((acc, val, i) => {
				if (i > 4) return acc;
				acc += `${acc.length === 0 ? '' : ' | '}${val.name} zit op ${
					val.counter || 0
				}`;
				return acc;
			}, '');
		},
		description: "Return a leaderboard of most typo's",
	},
	{
		name: 'trust',
		admin: true,
		reaction: false,
		response: async (message, userState) => {
			const { firstArg } = parseCommand(message, userState);
			if (!firstArg) return 'Please provide a user';
			const storage = container.resolve(DatabaseStorageService);
			await storage.updateGeneral('users', firstArg.toLowerCase(), {
				name: firstArg.toLowerCase(),
			});
			return `@${firstArg}, welcome to the typo gang`;
		},
		description: 'Trust new user',
		options: [
			{
				name: 'user',
				description: 'User to add to, lowercase',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'untrust',
		admin: true,
		reaction: false,
		response: async (message, userState) => {
			const { firstArg } = parseCommand(message, userState);
			if (!firstArg) return 'Please provide a user';
			const storage = container.resolve(DatabaseStorageService);
			let res = await storage.deleteGeneral('users', firstArg.toLowerCase());
			if (!res) {
				console.error('Untrust failed for user:', message);
				return 'fuck';
			}
			return `@${firstArg}, d'doei`;
		},
		description: 'Untrust a user',
		options: [
			{
				name: 'user',
				description: 'User to add to, lowercase',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
];

export default commands;
