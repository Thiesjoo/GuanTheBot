import { Command } from "@helpers/types";
import { DBStorageService } from "@services/storageService";
import { container } from "tsyringe";
import { parseCommand } from "../parseCommands";

const commands: Command[] = [
	{
		name: "addToUser",
		admin: true,
		reaction: false,
		response: async (message, userState) => {
			const { taggedUsername, args } = parseCommand(message, userState);
			if (!taggedUsername) {
				console.error("No tagged username", message);
				return;
			}
			const storage = container.resolve(DBStorageService);
			let res = await storage.increaseUser(taggedUsername, +args || 1);
			if (!res) {
				console.error("Message failed: ", taggedUsername);
			}
			return;
		},
	},
	{
		name: "counter",
		reaction: false,
		response: async (message, userState) => {
			const { taggedUsername } = parseCommand(message, userState);
			const storage = container.resolve(DBStorageService);

			if (taggedUsername === "triggers") {
				return `Er zijn nu al ${storage.triggers.length} triggers in de database`;
			}

			let user = storage.trustedUsers.find(
				(x) => x.name === taggedUsername.toLowerCase()
			);
			if (!user) {
				return "Die gebruiker is niet gevonden";
			}
			return `${taggedUsername} heeft nu al ${user.counter} iets verkeerd getypdt`;
		},
	},
	{
		name: "top",
		response: () => {
			const storage = container.resolve(DBStorageService);
			storage.trustedUsers.sort((a, b) => b.counter - a.counter);
			return storage.trustedUsers.reduce((acc, val, i) => {
				if (i > 2) return acc;
				acc += `${acc.length === 0 ? "" : " | "}${val.name} zit op ${
					val.counter || 0
				}`;
				return acc;
			}, "");
		},
	},
];

export default commands;
