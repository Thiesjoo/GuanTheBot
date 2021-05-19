export enum CommandOptionType {
	/** A sub-command for the application's command */
	SUB_COMMAND = 1,
	/** A group of sub-commands */
	SUB_COMMAND_GROUP = 2,
	/** A string. */
	STRING = 3,
	/** An integer. */
	INTEGER = 4,
	/** A boolean. */
	BOOLEAN = 5,
	/** A user, this would return the user's ID in the interaction. */
	USER = 6,
	/** A channel, this would return the channel's ID in the interaction. */
	CHANNEL = 7,
	/** A role, this would return the role's ID in the interaction. */
	ROLE = 8,
	/** Anything mentionable, returning the ID of the object. */
	MENTIONABLE = 9,
}
