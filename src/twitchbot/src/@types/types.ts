import { ChatUserstate } from 'tmi.js';

export type Base = { name: string };

type response = { response: string };

export type Trigger = Base & response;
export type Command = {
	name: string;
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
};
export type User = { name: string; counter: number };
export type Reaction = Base & response;
export type Listening = { name: string; lurk: boolean };
