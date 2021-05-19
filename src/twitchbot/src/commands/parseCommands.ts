import { ChatUserstate, Userstate } from 'tmi.js';

export type ParseCommandResult = {
	message: string;
	command: string | undefined;
	firstArg: string | undefined;
	fullArgs: string;
	args: string;
	taggedUsername: string;
};

export function parseCommand(
	message: string,
	{ username }: { username: string } | Userstate,
): ParseCommandResult {
	const tempCommand =
		message
			.match(/\%\w+|[\w\-\<\>\:\+\@]+|"[^"]+"/g)
			?.map((x) => x.replace(/\"/g, '')) || [];
	const command = tempCommand.shift()?.slice(1);

	const fullArgs = tempCommand.join(' ');

	const firstArg = tempCommand?.shift();
	const args = tempCommand?.join(' ');
	const taggedUsername = firstArg
		? //Discord mentions start with <@
		  firstArg.startsWith('<@')
			? firstArg
			: firstArg.replace('@', '')
		: username;

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
