import { CommandOptionType } from '@mytypes/discord_extra';
import { Command } from '@mytypes/types';
import { Collections } from '@services/mongoDB';
import { DatabaseStorageService } from '@services/storageService';
import { TwitchIRCService } from '@services/twitchIRC';
import { ChatUserstate } from 'tmi.js';
import { container } from 'tsyringe';
import { parseCommand } from '../parseCommands';

let defaultOption = [
	{
		name: 'name',
		description: 'Name of the new ...',
		type: CommandOptionType.STRING,
		required: true,
	},
	{
		name: 'value',
		description: 'Value of the new ...',
		type: CommandOptionType.STRING,
		required: true,
	},
];

const commands: Command[] = [
	{
		name: 'addreaction',
		response: updateFactory('reactions'),
		options: defaultOption,
	},
	{
		name: 'addcmd',
		response: updateFactory('commands'),
		options: defaultOption,
	},
	{
		name: 'addtrigger',
		response: updateFactory('triggers', true),
		options: defaultOption.slice(0, 1),
	},
	{
		name: 'deltrigger',
		response: deleteFactory('triggers'),
		options: defaultOption,
	},
	{
		name: 'delreaction',
		response: deleteFactory('reactions'),
		options: defaultOption,
	},
	{
		name: 'delcmd',
		response: deleteFactory('commands'),
		options: defaultOption.slice(0, 1),
	},
];

function updateFactory(type: keyof Collections, trigger = false) {
	return async (message: string, userState: ChatUserstate) => {
		const { firstArg, args } = parseCommand(message, userState);
		if (!firstArg || (!trigger && !args)) return 'pls provide correct args';
		const storage = container.resolve(DatabaseStorageService);
		let res = await storage.updateGeneral(type, firstArg, {
			name: firstArg,
			response: trigger && args.length === 0 ? null : args,
		});
		if (!res) {
			console.error('Message failed: ', message);
			return 'Update failed';
		}

		if (trigger) {
			console.log('we got a new trigger');
			//TODO: New trigger create/update event
		}
		return `Added ${type}.`;
	};
}

function deleteFactory(type: keyof Collections) {
	return async (message: string, userState: ChatUserstate) => {
		const { firstArg } = parseCommand(message, userState);
		if (!firstArg) return 'pls provide correct args';
		const storage = container.resolve(DatabaseStorageService);
		let res = await storage.deleteGeneral(type, firstArg);
		if (!res) {
			console.error('Message failed: ', message);
			return 'Deletion failed';
		}
		return 'deleted ' + type;
	};
}

export default commands.map((x) => {
	return { ...x, admin: true, reaction: true };
});
