import { AutoInjectable, Singleton } from "@helpers/tsyringe.reexport";
import { Listening, User, Trigger, Command, Reaction } from "@helpers/types";
import { UpdateQuery } from "mongodb";
import { Collections, DatabaseService } from "./mongoDB";

function get(from: any, key: any): any[] {
	return from[key];
}

@Singleton()
@AutoInjectable()
export class DBStorageService {
	users: User[] = [];
	listening: Listening[] = [];

	triggers: Trigger[] = [];
	reactions: Reaction[] = [];

	commands: Command[] = [];

	constructor(private db: DatabaseService) {}

	async updateAll() {
		this.triggers = await this.db.getAllTriggers();
		this.reactions = await this.db.getAllReactions();
		this.commands = await this.db.getAllCommands();
		this.listening = await this.db.getAllListeners();
		this.users = await this.db.getAllUsers();
	}

	async updateGeneral<T extends keyof Collections>(
		collection: T,
		name: string,
		update: Partial<Collections[T]>
	) {
		const col = get(this, collection);
		if (!col) return console.error(collection, this, "Went wrong");

		let res = col.findIndex((x) => x.name === name);
		if (res > -1) {
			col.splice(res, 1, {
				...col[res],
				...update,
			});
		} else {
			col.push(update);
		}
		await this.db.updateOne(
			collection,
			//@ts-ignore FIXME: Idk why typing doesnt work here
			{
				name: name,
			},
			{ $set: update },
			true
		);
		return true;
	}

	async deleteGeneral<T extends keyof Collections>(
		collection: T,
		name: string
	) {
		const col = get(this, collection);
		if (!col) return console.error(collection, this, "Went wrong");

		let res = col.findIndex((x) => x.name === name);
		if (res > -1) {
			col.splice(res, 1);
			await this.db.deleteOne(
				collection,
				//@ts-ignore FIXME: Idk why typing doesnt work here
				{
					name: name,
				}
			);
			return true;
		}
		return false;
	}

	async increaseUser(username: string, count: number) {
		let res = this.users.find((x) => x.name === username);
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

	async increaseCommandCounter(name: string, count: number) {
		let res = this.commands.find((x) => x.name === name);
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
