import { Command } from "@helpers/types";
import { DBStorageService } from "@services/storageService";
import { TwitchIRCService } from "@services/twitchIRC";
import { ChatUserstate } from "tmi.js";
import { container } from "tsyringe";
import { parseCommand } from "../parseCommands";
import * as os from "os";

const commands: Command[] = [
	{
		name: "listen",
		response: async (message, userState) => {
			await listenGeneric(message, userState, false);
			return "Listend to channel";
		},
	},
	{
		name: "unlisten",
		response: async (message, userState) => {
			await listenGeneric(message, userState, true);
			return "Unlistened to channel";
		},
	},
	{
		name: "info",
		response: () => {
			console.log("Info requested: ", process.env);
			return `Hostname: ${os.hostname()}`;
		},
	},
];

async function listenGeneric(
	message: string,
	userState: ChatUserstate,
	remove: boolean
) {
	const { taggedUsername } = parseCommand(message, userState);
	const storage = container.resolve(DBStorageService);
	const twitchIRC = container.resolve(TwitchIRCService);
	let promises = [
		storage[remove ? "removeNewListenChannel" : "addNewListenChannel"](
			taggedUsername
		),
		//Wrapping in promise to avoid ts errors
		new Promise(async (resolve) =>
			resolve(await twitchIRC.client[remove ? "part" : "join"](taggedUsername))
		),
	];
	await Promise.all(promises);
}

export default commands.map((x) => {
	return { ...x, admin: true };
});
