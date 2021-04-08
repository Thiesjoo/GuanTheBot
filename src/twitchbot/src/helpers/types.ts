import { Userstate } from "tmi.js";

export type Base = { name: string; response: string };

export type Trigger = Base;
export type Command = {
	name: string;
	counter?: number;
	admin?: boolean;
	reaction?: boolean;
	response:
		| ((message: string, userState: Userstate) => Promise<string>)
		| string;
};
export type User = { name: string; counter: number };
export type Reaction = Base;
export type Listening = { name: string };
