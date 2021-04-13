import { ChatUserstate } from 'tmi.js';
import { Command, Trigger, TrustedUser } from '@mytypes/types';

export async function getRes(
	result: Command,
	msg: string,
	userState: ChatUserstate = {},
) {
	return typeof result.response === 'string'
		? result.response
		: typeof result.response === 'function'
		? await result.response(msg, userState)
		: '';
}
