import { ConfigService } from '@helpers/configuration';
import { Command } from '@mytypes/types';
import axios from 'axios';
import { container } from 'tsyringe';
import { parseCommand } from '../parseCommands';

let lastTime = 0;

const commands: Command[] = [
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
	},
	{
		name: 'omega',
		reaction: false,
		response: async (message, userState) => {
			const { fullArgs } = parseCommand(message, userState);

			return fullArgs.replace(/o|O/g, ' OMEGALUL ');
		},
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
			if (outputString.length > 50) {
				return 'Sorry het antwoord is te lang';
			}
			lastTime = Date.now();
			return `Het antwoord is: ${outputString.slice(0, 50)}${
				outputString.length > 50 ? '...' : ''
			}`;
		},
	},
];
export default commands;
