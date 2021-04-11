import { ConfigService } from '@helpers/configuration';
import { AutoInjectable, Singleton } from '@helpers/tsyringe.reexport';
import {
	TrustedUser,
	Command,
	Listening,
	Reaction,
	Trigger,
	Base,
} from '@mytypes/types';
import {
	Db,
	FilterQuery,
	MongoClient,
	UpdateQuery,
	UpdateWriteOpResult,
} from 'mongodb';

export interface Collections {
	triggers: Trigger;
	commands: Command;
	users: TrustedUser;
	reactions: Reaction;
	listening: Listening;
}

@AutoInjectable()
@Singleton()
export class DatabaseService {
	private connection?: Db;

	constructor(private config: ConfigService) {}

	async initDb() {
		this.connection = (
			await MongoClient.connect(this.config.mongoURL, {
				useUnifiedTopology: true,
			})
		).db(this.config.mongoDB);
	}

	private async getAll<T extends keyof Collections>(
		collection: T,
	): Promise<Collections[T][]> {
		const res: Collections[T][] | undefined = await this.connection
			?.collection(collection)
			.find({})
			.toArray();
		return res || [];
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

	// async insertMany<T extends keyof Collections>(
	// 	collection: T,
	// 	docs: Collections[T][],
	// ): Promise<any> {
	// 	return await this.connection?.collection(collection).insertMany(docs);
	// }

	async updateOne<T extends keyof Collections>(
		collection: T,
		// FIXME: | Base is a workaround because typing doesnt work with generics?
		filter: FilterQuery<Collections[T]> | Base,
		update: UpdateQuery<Collections[T]>,
		upsert = false,
	): Promise<undefined | { upsertedCount: number }> {
		return await this.connection
			?.collection(collection)
			.updateOne(filter, update, { upsert });
	}

	async deleteOne<T extends keyof Collections>(
		collection: T,
		// FIXME: | Base is a workaround because typing doesnt work with generics?
		doc: FilterQuery<Collections[T]> | Base,
	): Promise<void> {
		await this.connection?.collection(collection).deleteOne(doc);
		return;
	}
}

export default DatabaseService;
