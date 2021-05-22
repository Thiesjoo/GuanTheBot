import { ConfigService } from '@helpers/configuration';
import { AutoInjectable } from '@helpers/tsyringe.reexport';
import {
	ApplicationCommandOption,
	Client,
	CommandInteraction,
	DMChannel,
	Intents,
	Message,
	NewsChannel,
	TextChannel,
} from 'discord.js';
import { DatabaseStorageService } from './storageService';
import { DiscordCommands } from '../commands/index';
import { Command } from '@mytypes/index';
import * as Mustache from 'mustache-async';
import { parseCommand } from '../commands/parseCommands';

@AutoInjectable()
export class DiscordService {
	client: Client;
	extraCommands = DiscordCommands;

	map: Record<string, Command> = {};

	constructor(
		private config: ConfigService,
		private dbStorage: DatabaseStorageService,
	) {}

	/** Initialize twitch client */
	async initClient() {
		return new Promise<void>(async (resolve) => {
			this.client = new Client({
				intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
			});

			this.client.login(this.config.discordToken);

			this.client.once('ready', async () => {
				if (!this.client) {
					throw new Error('wtf');
				}
				this.client.user?.setActivity({
					name: 'Syncing cmds',
				});
				try {
					//ON prod, use global commands
					let toCreate =
						process.env.TMI_USER === 'guanthebot'
							? //@ts-ignore
							  this.client.application.commands
							: //@ts-ignore
							  this.client.guilds.cache.get('839521739515625512').commands;
					const currentCommands = await toCreate.fetch();

					let promises = this.extraCommands
						.map(async (currentCommand) => {
							let res = currentCommands.find(
								(y) => y.name === currentCommand.name.toLowerCase(),
							);

							console.log(
								'DEBUG: Current: ',
								currentCommand.name,
								res ? 'found with discord' : 'not found yet',
							);

							if (!res) {
								console.log('creating: ', currentCommand);
								let created = await toCreate.create(
									this.cmdToInter(currentCommand),
								);
								this.map[created.id] = currentCommand;
							} else {
								if (
									//Check desc
									(currentCommand?.description ||
										'this is a default description') !== res.description ||
									//Check option length
									(currentCommand.options?.length || 0) !==
										res.options.length ||
									//Check option content (By looping over every item that we know should be there and comparing it to the discord version)
									!(currentCommand.options || []).every((x, i) => {
										let dis = res?.options[i];
										return Object.entries(x).every((y) => {
											// Ignore type paramter, because it can be a number or string
											//@ts-ignore THis is used to ignore index type, because ts is stooopid with object.entries.
											return y[0] === 'type' || dis[y[0]] === y[1];
										});
									})
								) {
									console.log('edit command', currentCommand, res);
									let edited = await toCreate.edit(
										res.id,
										this.cmdToInter(currentCommand),
									);
									this.map[edited.id] = currentCommand;
								} else {
									this.map[res.id] = currentCommand;
								}
							}
						})
						.filter((x) => x);
					await Promise.all(promises);
				} catch (e) {
					console.error('Error: ', e);
				}
				this.client.user?.setActivity({
					name: 'Bot done (:',
				});
				resolve();
			});
		});
	}

	private cmdToInter(cmd: Command) {
		return {
			name: cmd.name.toLowerCase(),
			description: cmd.description || 'this is a default description',
			options: cmd.options || [],
		};
	}

	/** Listen for messages and check if user wants to execute command */
	async listenForMessages() {
		//Never ending promise
		return new Promise((_) => {
			this.client.on('interaction', async (interaction) => {
				// If the interaction isn't a slash command, return
				if (!interaction.isCommand()) return;

				const username = interaction.user.username.toLowerCase();
				const displayName =
					(await interaction.guild?.members.fetch(interaction.user.id))
						?.nickname || interaction.user.username;

				const fndCommand2 = this.map[interaction.commandID];

				const fndCommand = this.getCommand(username, fndCommand2.name); //Return the correct command with permissions

				if (!fndCommand) {
					interaction.reply('You do not have permission for this');
					return;
				}

				const transformed = `%${
					interaction.commandName
				} ${interaction.options.reduce((acc, val) => {
					return (
						acc +
						'"' +
						(val.type === 'MENTIONABLE' ? `<@${val.value}>` : val.value) +
						'" '
					);
				}, '')}`;

				if (!transformed || !fndCommand) {
					interaction.reply('Something went pakot');
					console.error(transformed, fndCommand, interaction);
					return;
				}

				console.log('Transformed interaction to: ', transformed);
				const cmdResp = await this.parseResponse(
					transformed,
					username,
					displayName,
					fndCommand,
				);
				interaction.reply(`> *${transformed.trim()}* \n ${cmdResp}`);
				// interaction.followUp(cmdResp);
				this.dbStorage.increaseCommandCounter(fndCommand.name, 1);
			});

			this.client.on('message', async (messageData) => {
				const message = messageData.cleanContent;
				const username = messageData.author.username.toLowerCase();
				const displayName =
					(await messageData.guild?.members.fetch(messageData.author.id))
						?.nickname || messageData.author.username;
				if (
					messageData.author.bot ||
					username === this.config.tmiIdentity.username
				)
					return;

				let foundUser = this.dbStorage.data.users.find(
					(x) => x.name === username || x?.dcId === messageData.author.id,
				);

				if (username !== this.config.adminUser && !foundUser) return;
				if (!foundUser) {
					//Temporary object to satisfy ts
					foundUser = {
						name: this.config.adminUser,
						counter: 0,
					};
				}

				if (message[0] === '%') {
					let res = this.getCommand(
						username,
						parseCommand(message, { username: username }).command || '',
					);

					let toSend = await this.parseResponse(
						message,
						username,
						displayName,
						res,
					);

					if (toSend && res) {
						// Send reaction or just send a message
						if (res.reaction || res.reaction === undefined) {
							this.sendReaction(toSend, messageData);
						} else {
							this.sendMessage(toSend, messageData.channel);
						}
						this.dbStorage.increaseCommandCounter(res.name, 1);
					}
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
							await this.dbStorage.increaseUser(foundUser?.name, 1);
							//TODO: new user typo event. (Should add event to DB and send message to webserver)
							this.sendReaction(this.getRandomReaction().response, messageData);
						}
					}
					return;
				}
			});
		});
	}

	private async parseResponse(
		message: string,
		username: string,
		displayName: string,
		res?: Command,
	): Promise<string> {
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
		}
		return toSend;
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
