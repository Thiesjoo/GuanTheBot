import DBCommands from './admin/dbUpdates';
import UserCommands from './admin/users';
import ManagementCommands from './admin/management';
import ExtraCommands from './extra/extra';
import DiscordComm from './discord';

import { Command } from '@mytypes/types';

const all: Command[] = [
	...DBCommands,
	...UserCommands,
	...ExtraCommands,
	...ManagementCommands,
	...DiscordComm,
];

export default all;
export const DiscordCommands = all;
