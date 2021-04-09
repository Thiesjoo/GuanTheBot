import { ChatUserstate, Userstate } from "tmi.js";

export type Base = { name: string; response: string };

export type Trigger = Base;
export type Command = {
	name: string | string[];
	counter?: number;
	admin?: boolean;
	reaction?: boolean;
	response:
		| ((
				message: string,
				userState: ChatUserstate
		  ) => void | string | Promise<string | void>)
		| string
		| null;
};
export type User = { name: string; counter: number };
export type Reaction = Base;
export type Listening = { name: string };
