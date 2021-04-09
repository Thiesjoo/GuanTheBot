import { ConfigService } from "@helpers/configuration";
import { AutoInjectable, Singleton } from "@helpers/tsyringe.reexport";
import { User, Command, Listening, Reaction, Trigger } from "@helpers/types";
import { Db, MongoClient } from "mongodb";

interface Collections {
	triggers: Trigger[];
	commands: Command[];
	users: User[];
	reactions: Reaction[];
	listening: Listening[];
}

@AutoInjectable()
@Singleton()
export class DatabaseService {
	private connection: Db | null = null;

	constructor(private config: ConfigService) {}

	async initDb() {
		this.connection = (
			await MongoClient.connect(this.config.mongoURL, {
				useUnifiedTopology: true,
			})
		).db(this.config.mongoDB);
	}

	private async getAll<T extends keyof Collections>(
		collection: T
	): Promise<Collections[T]> {
		const res: Collections[T] | undefined = await this.connection
			?.collection(collection)
			.find({})
			.toArray();
		return res || [];
	}

	async getAllTriggers(): Promise<Trigger[]> {
		return this.getAll("triggers");
	}

	async getAllCommands(): Promise<Command[]> {
		return this.getAll("commands");
	}

	async getAllUsers(): Promise<User[]> {
		return this.getAll("users");
	}

	async getAllReactions(): Promise<Reaction[]> {
		return this.getAll("reactions");
	}

	async getAllListeners(): Promise<Listening[]> {
		return this.getAll("listening");
	}

	async increaseUser(username: string) {
		return this.connection?.collection("users").updateOne(
			{
				name: username,
			},
			{
				$inc: { counter: 1 },
			}
		);
	}
}
