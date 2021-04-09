import { Command } from "@helpers/types";
import { Collections } from "@services/mongoDB";
import { DBStorageService } from "@services/storageService";
import { TwitchIRCService } from "@services/twitchIRC";
import { ChatUserstate } from "tmi.js";
import { container } from "tsyringe";
import { parseCommand } from "../parseCommands";

const commands: Command[] = [
	{
		name: ["addreaction", "editreaction"],
		response: updateFactory("reactions"),
	},
	{
		name: ["addcmd", "editcmd"],
		response: updateFactory("commands"),
	},
	{
		name: ["addtrigger", "edittrigger"],
		response: updateFactory("triggers", true),
	},
	{
		name: "deltrigger",
		response: deleteFactory("triggers"),
	},
	{
		name: "delreaction",
		response: deleteFactory("reactions"),
	},
	{
		name: "delcmd",
		response: deleteFactory("commands"),
	},
];

function updateFactory(type: keyof Collections, trigger = false) {
	return async (message: string, userState: ChatUserstate) => {
		const { firstArg, args } = parseCommand(message, userState);
		if (!firstArg || !args) return "pls provide correct args";
		const storage = container.resolve(DBStorageService);
		let res = await storage.updateGeneral(type, firstArg, {
			name: firstArg,
			response: trigger && args.length === 0 ? null : args,
		});
		if (!res) {
			console.error("Message failed: ", message);
			return "Update failed";
		}
	};
}

function deleteFactory(type: keyof Collections) {
	return async (message: string, userState: ChatUserstate) => {
		const { firstArg } = parseCommand(message, userState);
		if (!firstArg) return "pls provide correct args";
		const storage = container.resolve(DBStorageService);
		let res = await storage.deleteGeneral(type, firstArg);
		if (!res) {
			console.error("Message failed: ", message);
			return "Deletion failed";
		}
	};
}

export default commands.map((x) => {
	return { ...x, admin: true, reaction: true };
});