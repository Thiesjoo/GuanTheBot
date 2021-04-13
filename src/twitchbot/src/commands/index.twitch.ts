import DBCommands from './admin/dbUpdates.twitch';
import UserCommands from './admin/users.twitch';
import ManagementCommands from './admin/management.twitch';
import ExtraCommands from './extra/extra.twitch';

export default [
	...DBCommands,
	...UserCommands,
	...ExtraCommands,
	...ManagementCommands,
];
