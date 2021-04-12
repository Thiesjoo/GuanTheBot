import { Command } from '@mytypes/types';
import { Collections } from '@services/mongoDB';
import { DatabaseStorageService } from '@services/storageService';
import { TwitchIRCService } from '@services/twitchIRC';
import { ChatUserstate } from 'tmi.js';
import { container } from 'tsyringe';
import { parseCommand } from '../parseCommands';

const commands: Command[] = [
	{
		name: 'addreaction',
		response: updateFactory('reactions'),
	},
	{
		name: 'addcmd',
		response: updateFactory('commands'),
	},
	{
		name: 'addtrigger',
		response: updateFactory('triggers', true),
	},
	{
		name: 'deltrigger',
		response: deleteFactory('triggers'),
	},
	{
		name: 'delreaction',
		response: deleteFactory('reactions'),
	},
	{
		name: 'delcmd',
		response: deleteFactory('commands'),
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
	};
}

export default commands.map((x) => {
	return { ...x, admin: true, reaction: true };
});
