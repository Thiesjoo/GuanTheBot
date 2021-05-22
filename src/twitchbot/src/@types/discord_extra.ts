export enum CommandOptionType {
	/** A sub-command for the application's command */
	SUB_COMMAND = 'SUB_COMMAND',
	/** A group of sub-commands */
	SUB_COMMAND_GROUP = 'SUB_COMMAND_GROUP',
	/** A string. */
	STRING = 'STRING',
	/** An integer. */
	INTEGER = 'INTEGER',
	/** A boolean. */
	BOOLEAN = 'BOOLEAN',
	/** A user, this would return the user's ID in the interaction. */
	USER = 'USER',
	/** A channel, this would return the channel's ID in the interaction. */
	CHANNEL = 'CHANNEL',
	/** A role, this would return the role's ID in the interaction. */
	ROLE = 'ROLE',
	/** Anything mentionable, returning the ID of the object. */
	MENTIONABLE = 'MENTIONABLE',
}
