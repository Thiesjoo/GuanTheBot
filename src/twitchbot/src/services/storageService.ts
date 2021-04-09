import { AutoInjectable, Singleton } from "@helpers/tsyringe.reexport";
import { Listening, User, Trigger, Command, Reaction } from "@helpers/types";
import { DatabaseService } from "./mongoDB";

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
}
