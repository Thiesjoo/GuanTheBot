import { DatabaseService } from '@services/mongoDB';
import { TwitchIRCService } from '@services/twitchIRC';
import { container } from 'tsyringe';
import { ConfigService } from './configuration';

export enum injectionKeys {}

export function registerIOCContainer(config: {}): void {
	container.registerSingleton(ConfigService);
	container.registerSingleton(DatabaseService);
	container.registerSingleton(TwitchIRCService);
}
