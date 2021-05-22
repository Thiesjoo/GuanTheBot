import { ConfigService } from '@helpers/configuration';
import { Command } from '@mytypes/types';
import axios from 'axios';
import { container } from 'tsyringe';
import { parseCommand } from '../parseCommands';
import Uwuifier from 'uwuifier';
import { CommandOptionType } from '@mytypes/discord_extra';
const uwuifier = new Uwuifier();

let lastTime = 0;
const responses = [
	'it is certain',
	'it is decidedly so',
	'without a doubt',
	'yes — definitely',
	'you may rely on it',
	'as I see it, yes',
	'most likely',
	'outlook good',
	'yes',
	'signs point to yes',
	'reply hazy, try again',
	'ask again later',
	'better not tell you now',
	'cannot predict now',
	'concentrate and ask again',
	'don’t count on it',
	'my reply is no',
	'my sources say no',
	'outlook not so good',
	'very doubtful',
	'no',
	'fuck you',
];

const commands: Command[] = [
	{
		name: '8ball',
		reaction: true,
		response: async () => {
			return responses[Math.floor(Math.random() * responses.length)];
		},
		description: 'Run a magic 8 ball command',
		options: [
			{
				name: 'question',
				description: 'The question you want to ask to magic 8ball',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'uwu',
		reaction: false,
		response: async (message, userState) => {
			return uwuifier.uwuifySentence(parseCommand(message, userState).fullArgs);
		},
		description: 'UwUify your sentence',
		options: [
			{
				name: 'sentence',
				description: 'The string you want to uwuify',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'hug',
		reaction: false,
		response: async (message, userState) => {
			const displayName = userState['display-name'];
			const { taggedUsername, args, fullArgs } = parseCommand(
				message,
				userState,
			);

			return `${displayName} hugs ${
				args.length > 1 ? fullArgs : taggedUsername
			} <3 cjoet`;
		},
		description: 'Hug someone!',
		options: [
			{
				name: 'person',
				description: 'The person to hug! (Doesnt work with roles)',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'omega',
		reaction: false,
		response: async (message, userState) => {
			const { fullArgs } = parseCommand(message, userState);

			return fullArgs.replace(/o|O/g, ' OMEGALUL ');
		},
		description: 'Replace all Os with OMEGALUL',
		options: [
			{
				name: 'sentence',
				description: 'String to replace',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
	{
		name: 'ask',
		response: async (message) => {
			let config = container.resolve(ConfigService);

			if (Date.now() - lastTime < 10 * 1000) {
				return 'Sorry wolfram heeft timeout. Eventjes wachten (:';
			}

			const messageArgsAsks = message.split(' ');
			messageArgsAsks?.shift();
			const messageArgs = messageArgsAsks?.join(' ');

			if (!messageArgs) {
				return 'Je moet wel een vraag stellen (: ';
			}

			console.log(
				'Args for wolfram ask command: ',
				encodeURIComponent(messageArgs),
			);

			// Encode input as URI component
			// Include our appID
			// Only include Solution and Result Pods
			// Return in json and without images(Plaintext)
			const wraData = (
				await axios.get(
					`http://api.wolframalpha.com/v2/query?input=${encodeURIComponent(
						messageArgs,
					)}&appid=${
						config.wraKey
					}&includepodid=Solution&includepodid=Result&includepodid=Definitions&includepodid=Definition:WordData&output=json&format=plaintext&translation=true&reinterpret=true`,
				)
			).data;
			console.log('Wolfram response: ', JSON.stringify(wraData));

			//WRA response failure
			if (!wraData || wraData?.queryresult?.error) {
				return 'YEP wolfram pakot';
			}

			//Error from WRA response
			if (wraData.queryresult.error || !wraData.queryresult.success) {
				return 'Hmmm ik begrijp je vraag niet. (Moet engels zijn (: )';
			}

			// Pods errors
			const res = wraData?.queryresult?.pods;
			if (!res) {
				return 'Er is helaas geen resultaat. Of je vraag is niet goed of er is bijvoorbeeld geen reeël resultaat';
			}
			const resPod = res[0];
			if (!resPod || !resPod?.subpods || resPod?.subpods?.length < 1) {
				return 'Er is geen resultaat Sadge';
			}

			let outputString = '';
			resPod.subpods.forEach((x: any) => {
				outputString += x.plaintext
					? (outputString.length === 0 ? '' : ' v ') + x.plaintext
					: '';
			});

			lastTime = Date.now();
			return `Het antwoord is: ${outputString.slice(0, 100)}${
				outputString.length > 100 ? '...' : ''
			}`;
		},
		description: 'Ask a question to Wolfram Alpha',
		options: [
			{
				name: 'question',
				description: 'The question you have',
				type: CommandOptionType.STRING,
				required: true,
			},
		],
	},
];
export default commands;
