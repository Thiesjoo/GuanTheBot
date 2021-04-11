import {
	Trigger,
	Command,
	TrustedUser,
	Reaction,
	Listening,
} from '../../src/@types/types';
import { DatabaseService } from '../../src/services/mongoDB';

export class MockDatabase implements PublicInterfaceOf<DatabaseService> {
	initDb;

	async getAll(name: string) {
		return [];
	}

	async getAllTriggers(): Promise<Trigger[]> {
		return this.getAll('triggers');
	}

	async getAllCommands(): Promise<Command[]> {
		return this.getAll('commands');
	}

	async getAllUsers(): Promise<TrustedUser[]> {
		return this.getAll('users');
	}

	async getAllReactions(): Promise<Reaction[]> {
		return this.getAll('reactions');
	}

	async getAllListeners(): Promise<Listening[]> {
		return this.getAll('listening');
	}

	async deleteOne() {
		return;
	}
	async updateOne(col, fil, upd, upsert) {
		return {
			upsertedCount: upsert ? 1 : 0,
		};
	}
}
