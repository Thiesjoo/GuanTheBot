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
	FindAndModifyWriteOpResultObject,
	InsertOneWriteOpResult,
	MongoClient,
	UpdateQuery,
	WithId,
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
				authSource: 'admin',
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

	async count(collection: keyof Collections, filter: Base) {
		return await this.connection?.collection(collection).count(filter);
	}

	get configCollection() {
		return this.connection?.collection('config');
	}

	private async getConfig(): Promise<{ discordChannelId?: string }> {
		return (await this.configCollection?.find({}).toArray())?.[0];
	}

	async fetchChannel(): Promise<string | undefined> {
		return (await this.getConfig())?.discordChannelId;
	}

	async setChannel(channel: string) {
		return await this.configCollection?.updateMany(
			{},
			{
				$set: {
					discordChannelId: channel,
				},
			},
		);
	}

	async insertOne<T extends keyof Collections>(
		collection: T,
		docs: Collections[T],
	): Promise<InsertOneWriteOpResult<WithId<Collections[T]>> | undefined> {
		return await this.connection?.collection(collection).insertOne(docs);
	}

	async updateOne<T extends keyof Collections>(
		collection: T,
		filter: FilterQuery<Collections[T]> | Base,
		update: UpdateQuery<Collections[T]>,
	): Promise<undefined | FindAndModifyWriteOpResultObject<Collections[T]>> {
		return await this.connection
			?.collection(collection)
			.findOneAndUpdate(filter, update, { returnOriginal: false });
	}

	async deleteOne<T extends keyof Collections>(
		collection: T,
		doc: Base,
	): Promise<void> {
		await this.connection?.collection(collection).deleteOne(doc);
		return;
	}
}

export default DatabaseService;
