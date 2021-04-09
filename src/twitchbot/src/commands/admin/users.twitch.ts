import { Command } from "@helpers/types";
import { DBStorageService } from "@services/storageService";
import { container } from "tsyringe";
import { parseCommand } from "../parseCommands";

const commands: Command[] = [
	{
		name: "addToUser",
		response: async (message, userState) => {
			const { taggedUsername, args } = parseCommand(message, userState);
			const storage = container.resolve(DBStorageService);

			return "test";
		},
	},
];

export default commands.map((x) => {
	return { ...x, admin: true };
});
