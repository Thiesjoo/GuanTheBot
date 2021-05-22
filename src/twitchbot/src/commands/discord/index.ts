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
		name: 'link',
		response: async (message, userState) => {
			const { firstArg: twitchUser, args: discordUser } = parseCommand(
				message,
				userState,
			);
			const storage = container.resolve(DatabaseStorageService);

			let found = storage.data.users.find((x) => x.name === twitchUser);
			console.log(found, storage.data.users);
			if (!found || !twitchUser) {
				return 'Twitch user not found';
			}

			const udpate = await storage.updateGeneral(
				'users',
				twitchUser,
				{ dcId: discordUser },
				false,
			);

			if (!udpate) {
				return 'Something went wrong in DB';
			}

			console.log(
				storage.data.users.find((x) => {
					x.name === twitchUser;
				}),
			);

			return 'User linked!';
		},
		description: 'Link users discord and twitch',
		options: [
			{
				name: 'name',
				description: 'Name of user already in DB',
				type: CommandOptionType.STRING,
				required: true,
			},
			{
				name: 'user',
				description: 'The user to link to',
				type: CommandOptionType.USER,
				required: true,
			},
		],
	},
];

export default commands.map((x) => {
	return { ...x, admin: true };
});
