import { Command } from "@helpers/types";
import { parseCommand } from "../parseCommands";

const commands: Command[] = [
	{
		name: "hug",
		reaction: false,
		response: async (message, userState) => {
			const displayName = userState["display-name"];
			const { taggedUsername, args, fullArgs } = parseCommand(
				message,
				userState
			);

			return `${displayName} hugs ${
				args.length > 1 ? fullArgs : taggedUsername
			} <3 cjoet`;
		},
	},
	{
		name: "omega",
		reaction: false,
		response: async (message, userState) => {
			const { fullArgs } = parseCommand(message, userState);

			return fullArgs.replace(/o/g, " OMEGALUL ");
		},
	},
];
export default commands;
