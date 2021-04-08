import { DatabaseService } from "src/services/mongoDB";
import { TwitchIRCService } from "src/services/twitchIRC";
import {
	autoInjectable,
	container,
	inject,
	injectable,
	singleton,
} from "tsyringe";
import { ConfigService } from "./configuration";

export enum injectionKeys {}

export function registerIOCContainer(config: {}): void {
	container.registerSingleton(ConfigService);
	container.registerSingleton(DatabaseService);
	container.registerSingleton(TwitchIRCService);

	// container.register(injectionKeys.tmiAccess, { useValue: config.tmiAccess });
}
