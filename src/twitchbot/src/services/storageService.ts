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
}
