import { Userstate } from 'tmi.js';

export function parseCommand(message: string, { username }: Userstate) {
	const tempCommand =
		message.match(/\%\w+|\w+|"[^"]+"/g)?.map((x) => x.replace(/\"/g, '')) || [];
	const command = tempCommand?.shift()?.slice(1);

	const fullArgs = tempCommand.join(' ');

	const firstArg = tempCommand?.shift();
	const args = tempCommand?.join(' ');
	const taggedUsername = firstArg ? firstArg.replace('@', '') : username;

	return {
		// The entire message
		message,
		// THe first part of the message
		command,
		// All the stuff after first command part
		fullArgs,

		// First argument
		firstArg,
		// Rest of the arguments
		args,
		taggedUsername,
	};
}
