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
	trustedUsers: User[] = [];
	listeners: Listening[] = [];

	triggers: Trigger[] = [];
	reactions: Reaction[] = [];

	commands: Command[] = [];

	constructor(private db: DatabaseService) {}

	async updateAll() {
		this.triggers = await this.db.getAllTriggers();
		this.reactions = await this.db.getAllReactions();
		this.commands = await this.db.getAllCommands();
		this.listeners = await this.db.getAllListeners();
		this.trustedUsers = await this.db.getAllUsers();
	}

	async updateGeneral<T extends keyof Collections>(
		collection: T,
		name: string,
		update: Collections[T]
	) {
		const col = get(this, collection);
		if (!col) return console.error(collection, this, "Went wrong");

		let res = col.findIndex((x) => x.name === name);
		if (res > -1) {
			col.splice(res, 1, update);
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
		return false;
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
		}
		return false;
	}

	async addNewListenChannel(arg: string) {
		this.listeners.push({ name: arg });
		await this.db.insertMany("listening", [
			{
				name: arg,
			},
		]);
		return;
	}

	async removeNewListenChannel(arg: string) {
		let res = this.listeners.findIndex((x) => x.name === arg);
		if (res > -1) {
			this.listeners.splice(res, 1);
			await this.db.deleteOne("listening", {
				name: arg,
			});
		}
		return;
	}

	async increaseUser(username: string, count: number) {
		let res = this.trustedUsers.find((x) => x.name === username);
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
}
