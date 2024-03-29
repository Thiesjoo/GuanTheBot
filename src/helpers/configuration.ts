import { Injectable } from './tsyringe.reexport';

@Injectable()
export class ConfigService {
	get tmiIdentity(): {
		username: string;
		password: string | (() => string | Promise<string>);
	} {
		return {
			username: process.env.TMI_USER || '',
			password: process.env.TMI_KEY || '',
		};
	}

	get mongoURL() {
		return (
			process.env.MONGO_URL ||
			process.env.QOVERY_DATABASE_MY_MONGODB_CONNECTION_URI ||
			`mongodb://${process.env.QOVERY_DB_ZFAD4D02D_LOGIN}:${process.env.QOVERY_DB_ZFAD4D02D_PASSWORD}@${process.env.QOVERY_DB_ZFAD4D02D_HOST}:${process.env.QOVERY_DB_ZFAD4D02D_PORT}` ||
			''
		);
	}

	get mongoDB() {
		return process.env.MONGO_DB || 'twitchbot';
	}

	get version() {
		return process.env.QOVERY_APPLICATION_COMMIT_SHA_SHORT || '000000';
	}

	get adminUser() {
		return process.env.ADMIN_USER || 'guanthethird';
	}

	get wraKey() {
		return process.env.WRA_KEY || '';
	}

	get discordToken() {
		return process.env.DISCORD_TOKEN || '';
	}
}
