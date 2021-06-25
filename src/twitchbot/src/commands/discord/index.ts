import { Command } from '@mytypes/types';
import { DatabaseStorageService } from '@services/storageService';
import { container } from 'tsyringe';
import { parseCommand } from '../parseCommands';
import { CommandOptionType } from '@mytypes/discord_extra';
import DatabaseService from '@services/mongoDB';
import { DiscordService } from '@services/discordInteractions';

const commands: Command[] = [
	{
		name: 'events',
		response: async (message, userState) => {
			const { firstArg } = parseCommand(message, userState);
			const discordService = container.resolve(DiscordService);
			const storage = container.resolve(DatabaseStorageService);
			const db = container.resolve(DatabaseService);

			if (!firstArg) return;
			console.log(storage, db, discordService);
			console.log(
				storage.sendChannel,
				firstArg,
				discordService.client.channels.fetch(firstArg as `${bigint}`),
			);
		},
		description:
			"Provide an events channel to dump all events related to Typo's",
		options: [
			{
				name: 'channel',
				description: "The new channel for event's",
				type: CommandOptionType.CHANNEL,
				required: true,
			},
		],
	},

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
