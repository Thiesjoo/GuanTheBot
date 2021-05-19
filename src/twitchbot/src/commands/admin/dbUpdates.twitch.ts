import { Command } from '@mytypes/types';
import { DatabaseStorageService } from '@services/storageService';
import { TwitchIRCService } from '@services/twitchIRC';
import { ChatUserstate } from 'tmi.js';
import { container } from 'tsyringe';
import { parseCommand } from '../parseCommands';
import * as os from 'os';
import { CommandOptionType } from '@mytypes/discord_extra';

const commands: Command[] = [
	{
		name: 'cmdcounter',
		response: async (message, userState) => {
			const { firstArg } = parseCommand(message, userState);
			const storage = container.resolve(DatabaseStorageService);
			let res = storage.data.commands.find((x) => x.name === firstArg);
			if (!res) {
				return 'Command with that name was not found';
			}
			return `${firstArg} is nu al ${res.counter} keer gebruikt`;
		},
		description: 'Get count of command',
		options: [
			{
				name: 'name',
				description: 'Name of command',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'setcmdcounter',
		admin: true,
		response: async (message, userState) => {
			const { firstArg, args } = parseCommand(message, userState);
			const storage = container.resolve(DatabaseStorageService);
			let res = storage.updateGeneral('commands', firstArg || '', {
				name: firstArg || '',
				counter: +args,
			});
			if (!res) {
				return 'Command with that name was not found';
			}
			return `${firstArg} updated`;
		},
		description: 'Get count of command',
		options: [
			{
				name: 'name',
				description: 'Name of command',
				type: CommandOptionType.STRING,
				required: true,
			},
			{
				name: 'amount',
				description: 'Amount to add',
				required: true,
				type: CommandOptionType.INTEGER,
			},
		],
	},
	{
		name: 'refresh',
		admin: true,
		response: async () => {
			const storage = container.resolve(DatabaseStorageService);
			const twitch = container.resolve(TwitchIRCService);
			storage.data.listening.forEach((x) => twitch.client.part(x.name));
			await storage.updateAll();
			storage.data.listening.forEach((x) => twitch.client.join(x.name));
		},
		description: 'Refresh entire bot',
	},
	{
		name: 'listen',
		response: async (message, userState) => {
			await listenGeneric(message, userState, false);
			return 'Listend to channel';
		},
		description: 'Listen to new user',
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
		name: 'unlisten',
		response: async (message, userState) => {
			await listenGeneric(message, userState, true);
			return 'Unlistened to channel';
		},
		description: 'Unlisten to user',
		options: [
			{
				name: 'user',
				description: 'User to remove, lowercase',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'info',
		response: () => {
			console.log('Info requested: ', process.env);
			return `Hostname: ${os.hostname()}`;
		},
		description: 'Dump info of the bot',
	},
];

async function listenGeneric(
	message: string,
	userState: ChatUserstate,
	remove: boolean,
) {
	const { taggedUsername, args } = parseCommand(message, userState);
	const storage = container.resolve(DatabaseStorageService);
	const twitchIRC = container.resolve(TwitchIRCService);
	let promises = [
		remove
			? storage.deleteGeneral('listening', taggedUsername)
			: storage.updateGeneral('listening', taggedUsername, {
					name: taggedUsername,
					lurk: args === 'true' ? true : false,
			  }),
		//Wrapping in promise to avoid ts errors
		new Promise(async (resolve) =>
			resolve(await twitchIRC.client[remove ? 'part' : 'join'](taggedUsername)),
		),
	];
	await Promise.all(promises);
}

export default commands.map((x) => {
	return { ...x, admin: true };
});
