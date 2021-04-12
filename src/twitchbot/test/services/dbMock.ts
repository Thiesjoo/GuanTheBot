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

	localCache: any = {};

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

	async insertOne(collection, item) {
		//MAKE SURE TO CLONE AND NOT COPY
		this.localCache[collection] = [{ ...item }];
		return true;
	}

	async deleteOne() {
		return true;
	}

	//TODO: This is a very simple mock
	async updateOne(col, fil, upd, upsert) {
		let item = this.localCache[col].find((x) => x.name === fil.name);

		if (!item) return undefined;
		Object.entries(upd).forEach((updateQueryPart: [string, {}]) => {
			switch (updateQueryPart[0]) {
				case '$set': {
					Object.entries(updateQueryPart[1]).forEach((y) => {
						item[y[0]] = y[1];
					});
					break;
				}
				case '$inc': {
					Object.entries(updateQueryPart[1]).forEach((y) => {
						if (!item[y[0]]) item[y[0]] = 0;
						item[y[0]] += y[1];
					});
					break;
				}
			}
		});

		return {
			ok: true,
			value: item,
		};
	}
}
