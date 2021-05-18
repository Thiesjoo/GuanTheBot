import { ConfigService } from '@helpers/configuration';
import { AutoInjectable } from '@helpers/tsyringe.reexport';
import {
	Channel,
	Client,
	DMChannel,
	Message,
	NewsChannel,
	TextChannel,
} from 'discord.js';
import { DatabaseStorageService } from './storageService';
import ExtraCommands from '../commands/index.twitch';
import { Command } from '@mytypes/index';
import * as Mustache from 'mustache-async';
import { parseCommand } from '../commands/parseCommands';

@AutoInjectable()
export class DiscordService {
	client: Client;
	extraCommands = ExtraCommands;

	constructor(
		private config: ConfigService,
		private dbStorage: DatabaseStorageService,
	) {}

	/** Initialize twitch client */
	async initClient() {
		return new Promise<void>(async (resolve) => {
			this.client = new Client({});

			this.client.login(this.config.discordToken);

			this.client.once('ready', () => {
				resolve();
			});
		});
	}

	/** Listen for messages and check if user wants to execute command */
	async listenForMessages() {
		//Never ending promise
		return new Promise((_) => {
			this.client.on('message', async (messageData) => {
				const message = messageData.cleanContent;

				// const { username: _username, 'display-name': _displayName } = userState;
				const username = messageData.author.username.toLowerCase();
				const displayName =
					messageData.guild?.member(messageData.author.id)?.nickname ||
					messageData.author.username;
				if (
					messageData.author.bot ||
					username === this.config.tmiIdentity.username
				)
					return;

				console.log(username, displayName, message);

				if (
					username !== this.config.adminUser &&
					!this.dbStorage.data.users.find((x) => x.name === username)
				)
					return;

				if (message[0] === '%') {
					let res = this.getCommand(
						username,
						parseCommand(message, { username: username }).command || '',
					);
					let toSend: string = '';
					// Handle calling async responses
					if (res && typeof res.response === 'string') {
						toSend = res.response;
					} else if (res && typeof res.response === 'function') {
						toSend =
							(await res.response(message, {
								username: username,
								'display-name': displayName,
							})) || '';
					} else {
						return console.error('Command not found');
					}
					// Send reaction or just send a message
					if (res.reaction || res.reaction === undefined) {
						this.sendReaction(toSend, messageData);
					} else {
						console.log('asd', toSend, parseCommand(message, { username }));
						this.sendMessage(toSend, messageData.channel);
					}
					this.dbStorage.increaseCommandCounter(res.name, 1);
					return;
				} else {
					const triggerFound = this.dbStorage.data.triggers.find((x) =>
						message.includes(x.name),
					);
					if (triggerFound) {
						if (triggerFound.response) {
							this.sendReaction(triggerFound.response, messageData);
						} else {
							// Update the user counter
							await this.dbStorage.increaseUser(username, 1);
							//TODO: new user typo event. (Should add event to DB and send message to webserver)
							this.sendReaction(this.getRandomReaction().response, messageData);
						}
					}
					return;
				}
			});
		});
	}

	private getCommand(username: string, command: string): Command | undefined {
		if (!username || !command) return undefined;
		let res: Command | undefined;
		//Admin commands
		if (username === this.config.adminUser) {
			res = this.extraCommands.find((x) =>
				x.admin && typeof x.name === 'string'
					? x.name === command
					: x.name.includes(command),
			);
		}

		//User special commands
		if (!res) {
			res = this.extraCommands.find((x) => !x.admin && x.name === command);
		}

		//Default commands
		if (!res) {
			res = this.dbStorage.data.commands.find((x) => x.name === command);
		}
		return res;
	}

	// /** Replace count variable in the  */
	private async replaceVariables(msg: Command): Promise<string> {
		if (typeof msg.response !== 'string') {
			console.error('GOT WRONG RESPONSE');
			return '';
		}
		return await Mustache.render(
			typeof msg.response === 'string' ? msg.response : '',
			{
				count: async () => {
					return msg?.counter || 0;
				},
			},
			null,
			['${', '}'],
		);
	}

	private async sendReaction(
		msg: string | Command,
		channel: Message,
	): Promise<any> {
		if (typeof msg !== 'string') {
			msg = await this.replaceVariables(msg);
		}

		return channel.reply(msg);
	}

	private async sendMessage(
		msg: string | Command,
		channel: TextChannel | DMChannel | NewsChannel,
	): Promise<any> {
		if (typeof msg !== 'string') {
			msg = await this.replaceVariables(msg);
		}

		return channel.send(msg);
	}

	private getRandomReaction() {
		return this.dbStorage.data.reactions[
			Math.floor(Math.random() * this.dbStorage.data.reactions.length)
		];
	}
}
