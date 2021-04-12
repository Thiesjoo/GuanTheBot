import { AutoInjectable, Singleton } from '@helpers/tsyringe.reexport';
import { Base } from '@mytypes/types';
import { MatchKeysAndValues, UpdateQuery, UpdateWriteOpResult } from 'mongodb';
import { Collections, DatabaseService } from './mongoDB';

type UpdateGeneralFunctionType =
	| (<T extends keyof Collections>(
			collection: T,
			name: string,
			// All property's are optional, expect base type
			update: Collections[T],
			upsert: true,
	  ) => Promise<{ upsertedCount: number }>)
	| (<T extends keyof Collections>(
			collection: T,
			name: string,
			// All property's are optional, expect base type
			update: MatchKeysAndValues<Collections[T]>,
			upsert: false,
	  ) => Promise<{ upsertedCount: number }>);
@Singleton()
@AutoInjectable()
export class DBStorageService {
	data: {
		[key in keyof Collections]: Collections[key][];
	} = {
		users: [],
		listening: [],
		triggers: [],
		reactions: [],
		commands: [],
	};

	constructor(private db: DatabaseService) {}

	async updateAll() {
		this.data = {
			triggers: await this.db.getAllTriggers(),
			reactions: await this.db.getAllReactions(),
			commands: await this.db.getAllCommands(),
			listening: await this.db.getAllListeners(),
			users: await this.db.getAllUsers(),
		};
	}

	/** Update a document, or add a new one if the document does not exist yet */
	private async upsertGeneral<T extends keyof Collections>(
		collection: T,
		update: Collections[T] & Base,
		upsert = true,
	): Promise<Collections[T] | false> {
		let count = this.data[collection].findIndex(
			(x: Base) => x.name === update.name,
		);
		if (count > -1) {
			let updateRes = await this.db.updateOne(
				collection,
				{
					name: update.name,
				},
				{
					$set: {
						...update,
					},
				},
			);

			if (updateRes === undefined || (updateRes && !updateRes.value)) {
				console.error(
					'DESYNC BETWEEN DATABASE AND LOCAL COLLECTIONS',
					JSON.stringify(this),
				);
				return false;
			}

			//@ts-ignore
			this.data[collection].splice(count, 1, updateRes.value);

			//@ts-ignore FIXME: ts stoopid?
			return updateRes.value;
		} else if (upsert) {
			let result = await this.db.insertOne(collection, update);
			if (!result) return false;

			//@ts-ignore
			this.data[collection].push(update);

			return update;
		}
		return false;
	}

	async updateGeneral<T extends keyof Collections>(
		collection: T,
		name: string,
		update: Partial<Collections[T]>,
		upsert = true,
	) {
		return this.upsertGeneral(
			collection,
			//@ts-ignore
			{
				...update,
				name,
			},
			upsert,
		);
	}

	/** Delete item from array */
	async deleteGeneral<T extends keyof Collections>(
		collection: T,
		name: string,
	) {
		const col: Base[] = this.data[collection];

		let res = col.findIndex((x) => x.name === name);
		if (res > -1) {
			col.splice(res, 1);
			await this.db.deleteOne(collection, {
				name: name,
			});
			return true;
		}
		return false;
	}
	// TODO: Refactor this to general functions

	/** Increase count of 1 users */
	async increaseUser(name: string, count: number) {
		return this.increaseGeneral('users', name, count);
	}

	/** Increase the counter of a specific command */
	async increaseCommandCounter(name: string, count: number) {
		return this.increaseGeneral('commands', name, count);
	}

	private async increaseGeneral(
		collection: 'users' | 'commands',
		name: string,
		amount: number,
	) {
		let resIndex = this.data[collection].findIndex(
			(x: Base) => x.name === name,
		);
		if (resIndex > -1) {
			let res = this.data[collection][resIndex];
			if (!res.counter) res.counter = 0;
			res.counter += amount;
			await this.db.updateOne(
				collection,
				{
					name,
				},
				{
					$inc: {
						counter: amount,
					},
				},
			);
			return true;
		}
		return false;
	}
}
