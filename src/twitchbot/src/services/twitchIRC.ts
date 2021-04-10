import { ConfigService } from "@helpers/configuration";
import { AutoInjectable } from "@helpers/tsyringe.reexport";
import { Client } from "tmi.js";
import { DBStorageService } from "./storageService";
import ExtraCommands from "../commands/index.twitch";
import { Command } from "@mytypes/index";
import * as Mustache from "mustache-async";
@AutoInjectable()
export class TwitchIRCService {
	client: Client;

	extraCommands = ExtraCommands;

	constructor(
		private config: ConfigService,
		private dbStorage: DBStorageService
	) {}

	/** Initialize twitch client */
	async initTwitchClient() {
		return new Promise<void>(async (resolve) => {
			this.client = new Client({
				identity: this.config.tmiIdentity,
				connection: {
					reconnect: true,
					secure: true,
				},
				channels: [
					...this.dbStorage.data.listening.map((x) => x.name),
					this.config.tmiIdentity.username,
					"guanthefirst",
				],
			});

			this.client.on("disconnected", (reason) => {
				console.log({ message: "disconnected from chat", reason });
			});
			this.client.on("connected", (address, port) => {
				console.log({ message: "connected to chat", address, port });
			});
			this.client.on("connecting", (address, port) => {
				console.log({
					message: "connecting to chat",
					connectionData: { address, port },
				});
			});
			this.client.on("reconnect", () => {
				console.log({ message: "reconnecting to chat" });
			});

			this.client.once("connected", () => {
				resolve();
			});
			await this.client.connect();
		});
	}

	/** Listen for messages and check if user wants to execute command */
	async listenForMessages() {
		//Never ending promise
		return new Promise((_) => {
			this.client.on("message", async (channel, userState, message, self) => {
				const { username: _username, "display-name": _displayName } = userState;
				const username = _username || "";
				const displayName = _displayName || "";
				if (self || username === this.config.tmiIdentity.username) return;

				if (
					username !== this.config.adminUser &&
					!this.dbStorage.data.users.find((x) => x.name === username)
				)
					return;

				// Parse the command. Will return array with ['command', ...args]
				const tempCommand = message
					.match(/\%\w+|\w+|"[^"]+"/g)
					?.map((x) => x.replace(/\"/g, ""));

				const command = tempCommand?.shift()?.slice(1) || "";

				if (message[0] === "%") {
					let res: Command | undefined;

					//Admin commands
					if (username === this.config.adminUser) {
						res = this.extraCommands.find((x) =>
							x.admin && typeof x.name === "string"
								? x.name === command
								: x.name.includes(command)
						);
					}

					//User special commands
					if (!res) {
						res = this.extraCommands.find((x) => x.name === command);
					}

					//Default commands
					if (!res) {
						res = this.dbStorage.data.commands.find((x) => x.name === command);
					}

					let toSend: string = "";
					// Handle calling async responses
					if (res && typeof res.response === "string") {
						toSend = res.response;
					} else if (res && typeof res.response === "function") {
						toSend = (await res.response(message, userState)) || "";
					} else {
						return console.error("Command not found");
					}

					let foundChannel = this.dbStorage.data.listening.find(
						(x) => x.name === channel.substr(1)
					);
					if (foundChannel && foundChannel.lurk !== undefined) {
						if (foundChannel.lurk) return;
					}

					// Send reaction or just send a message
					if (res.reaction || res.reaction === undefined) {
						this.sendReaction(displayName, toSend, channel);
					} else {
						this.sendMessage(toSend, channel);
					}
					this.dbStorage.increaseCommandCounter(res.name, 1);

					return;
				} else {
					const triggerFound = this.dbStorage.data.triggers.find((x) =>
						message.includes(x.name)
					);
					if (triggerFound) {
						if (triggerFound.response) {
							this.sendReaction(displayName, triggerFound.response, channel);
						} else {
							// Update the user counter
							await this.dbStorage.increaseUser(username, 1);

							//TODO: new user typo event. (Should add event to DB and send message to webserver)

							this.sendReaction(
								displayName,
								this.getRandomReaction().response,
								channel
							);
						}
					}
					return;
				}
			});
		});
	}

	/** Replace count variable in the  */
	private async replaceVariables(msg: Command): Promise<string> {
		if (typeof msg.response !== "string") {
			console.error("GOT WRONG RESPONSE");
			return "";
		}
		return await Mustache.render(
			typeof msg.response === "string" ? msg.response : "",
			{
				count: async () => {
					return msg?.counter || 0;
				},
			},
			null,
			["${", "}"]
		);
	}

	private async sendReaction(
		toUser: string,
		msg: string | Command,
		channel: string
	): Promise<string[]> {
		if (typeof msg !== "string") {
			msg = await this.replaceVariables(msg);
		}

		return this.sendMessage(`${toUser}, ${msg}`, channel);
	}

	private async sendMessage(
		msg: string | Command,
		channel: string
	): Promise<string[]> {
		if (typeof msg !== "string") {
			msg = await this.replaceVariables(msg);
		}
		return this.client.say(channel, msg);
	}

	private getRandomReaction() {
		return this.dbStorage.data.reactions[
			Math.floor(Math.random() * this.dbStorage.data.reactions.length)
		];
	}
}
