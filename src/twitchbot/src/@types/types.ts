import { ApplicationCommandOption } from 'discord.js';
import { ChatUserstate } from 'tmi.js';

/** Extra type for ease of use */
type response = { response: string };

export type Base = { name: string };

/** Triggers in chat */
export type Trigger = Base & response;

/** Command in chat. (Can have a function as response, for custom commands) */
export type Command = Base & {
	counter?: number;
	admin?: boolean;
	reaction?: boolean;
	response:
		| ((
				message: string,
				userState: ChatUserstate,
		  ) => void | string | Promise<string | void>)
		| string
		| null;

	//Discord
	description?: string;
	options?: ApplicationCommandOption[];
};

/** Trusted user of application */
export type TrustedUser = Base & { counter: number };

/** Reaction to TYPO */
export type Reaction = Base & response;

/** Channel to listen to */
export type Listening = Base & { lurk?: boolean };
