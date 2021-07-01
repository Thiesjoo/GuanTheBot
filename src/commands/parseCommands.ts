import { ChatUserstate, Userstate } from 'tmi.js';

export type ParseCommandResult = {
	/** The entire message, reexported */
	message: string;
	/** The command (The intial word after %) */
	command: string | undefined;
	/** Everything except the command */
	fullArgs: string;
	/** The first argument after a command */
	firstArg: string | undefined;
	/** The rest of the args, except firstArg  */
	args: string;
	/** The user tagged, without @  */
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
