import { AutoInjectable, Singleton } from "@helpers/tsyringe.reexport";
import { Base } from "@mytypes/types";
import { MatchKeysAndValues, UpdateQuery } from "mongodb";
import { Collections, DatabaseService } from "./mongoDB";

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

	async updateGeneral<T extends keyof Collections>(
		collection: T,
		name: string,
		// All property's are optional, expect base type
		update: MatchKeysAndValues<Collections[T]> & Base
	) {
		const col: Base[] = this.data[collection];

		let res = col.findIndex((x: Base) => x.name === name);
		if (res > -1) {
			col.splice(res, 1, {
				...col[res],
				...update,
			});
		} else {
			col.push(update);
		}
		return await this.db.updateOne(
			collection,
			{
				name: name,
			},
			{ $set: update },
			true
		);
	}

	/** Delete item from array */
	async deleteGeneral<T extends keyof Collections>(
		collection: T,
		name: string
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
	async increaseUser(username: string, count: number) {
		let res = this.data.users.find((x) => x.name === username);
		if (res) {
			res.counter += count;
			await this.db.updateOne(
				"users",
				{
					name: username,
				},
				{
					$inc: {
						counter: count,
					},
				}
			);
			return true;
		}
		return false;
	}

	/** Increase the counter of a specific command */
	async increaseCommandCounter(name: string | string[], count: number) {
		if (typeof name !== "string") {
			// When type is string[] the command is a local command, and count should not be stored
			return true;
		}

		let res = this.data.commands.find((x) => x.name === name);
		if (res) {
			if (!res.counter) res.counter = 0;
			res.counter += count;
			await this.db.updateOne(
				"commands",
				{
					name,
				},
				{
					$inc: {
						counter: count,
					},
				}
			);
			return true;
		}
		return false;
	}
}
