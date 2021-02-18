const tmi = require("tmi.js");
const dotenv = require("dotenv");
const exec = require("await-exec");
dotenv.config();
const MongoClient = require("mongodb").MongoClient;

async function main() {
	return new Promise(async (done, err) => {
		const db = (
			await MongoClient.connect(process.env.MONGO_URL, {
				useUnifiedTopology: true,
			})
		).db(process.env.MONGO_DB);
		const listening = await (
			await db.collection("listening").find({}).toArray()
		).map((x) => {
			return x.name;
		});

		const client = new tmi.Client({
			identity: {
				username: process.env.TMI_USER,
				password: process.env.TMI_KEY,
			},
			connection: {
				reconnect: true,
				secure: true,
			},
			channels: [...listening, process.env.TMI_USER],
		});

		const usersColl = db.collection("users");

		const triggersColl = db.collection("triggers");
		const reactionsColl = db.collection("reactions");

		const commandsColl = db.collection("commands");

		await client.connect();
		console.log("Goewan bot initialized");

		let users;
		let triggers;
		const refreshUsers = async () => {
			users = await usersColl.find({}).toArray();
		};
		const refreshTriggers = async () => {
			triggers = await triggersColl.find({}).toArray();
		};

		await refreshUsers();
		await refreshTriggers();

		client.on("message", async (channel, tags, message, self) => {
			const { username, "display-name": displayName } = tags;
			const sendMsg = (msg) => client.say(channel, `@${username}, ${msg}`);
			if (self) return;

			const tempCommand = message
				.match(/\%\w+|\w+|"[^"]+"/g)
				?.map((x) => x.replace(/\"/g, ""));
			const command = tempCommand?.shift()?.slice(1);

			const firstArg = tempCommand?.shift();
			const args = tempCommand?.join(" ");

			if (username === process.env.ADMIN_USER && message[0] === "%") {
				switch (command) {
					case "listen":
						await update(db.collection("listening"), firstArg);
						client.disconnect();
						client.removeAllListeners("message");
						err("RECON");
						break;
					case "unlisten":
						await del(db.collection("listening"), firstArg);
						client.disconnect();
						client.removeAllListeners("message");
						err("RECON");
						break;

					case "resetCountersAASDTHISISRANDOMTONOTTRIGGERAUTO":
						console.log("resettings");
						const splitted = message.split(" ");
						const userName =
							splitted?.length > 1 ? splitted[1].replace("@", "") : username;
						await usersColl.updateOne(
							{ name: userName },
							{ $set: { counter: 0 } }
						);
						return;

					case "dumpTHISISARANDOMSTRINGPLSNORESTORE":
						if (process.env.NODE_ENV !== "production") {
							let res = await exec(
								`mongodump --uri="${process.env.MONGO_URL}/${process.env.MONGO_DB}"`
							);
							console.log(res);
						}
						return;
					case "restoreTHISISARANDOMSTRINGPLSNORESTORE":
						if (process.env.NODE_ENV !== "production") {
							let res2 = await exec(
								`mongorestore --uri="${process.env.MONGO_URL}/${process.env.MONGO_DB}" --nsFrom="twitchtestbot.*" --nsTo="${process.env.MONGO_DB}.*" dump/`
							);
							console.log(res2);
							await refreshUsers();
							await refreshTriggers();
						}
						return;

					case "editreaction":
					case "addreaction":
						await update(reactionsColl, firstArg, args);
						return;
					case "delreaction":
						await del(reactionsColl, firstArg);
						return;

					case "edittrigger":
					case "addtrigger":
						await update(
							triggersColl,
							firstArg,
							args.length === 0 ? null : args
						);
						await refreshTriggers();
						console.log("added trigger", firstArg);
						return;
					case "deltrigger":
						await del(triggersColl, firstArg);
						await refreshTriggers();
						console.log("deleted trigger", firstArg);
						return;

					case "editcmd":
					case "addcmd":
						await update(commandsColl, firstArg, args);
						return;
					case "delcmd":
						await del(commandsColl, firstArg);
						return;

					case "trust":
						await update(usersColl, firstArg);
						await refreshUsers();
						return;
					case "untrust":
						await del(usersColl, firstArg);
						await refreshUsers();
						return;
				}
			}

			if (users.find((x) => x.name === username)) {
				if (message[0] === "%") {
					switch (command) {
						case "counter":
							const splitted = message.split(" ");
							const userName =
								splitted?.length > 1 ? splitted[1].replace("@", "") : username;
							const test = await usersColl.findOne({ name: userName });
							if (!test) {
								sendMsg("User niet gevonden in database");
								return;
							}
							sendMsg(
								`${userName} heeft nu al ${test.counter} iets verkeerd getypdt`
							);

							return;
						default:
							const found = await commandsColl.findOne({
								name: command,
							});
							if (!found) return;
							sendMsg(found.response);
							return;
					}
				} else {
					const triggerFound = triggers.find((x) => message.includes(x.name));
					if (triggerFound) {
						if (triggerFound.response) {
							sendMsg(triggerFound.response);
						} else {
							const random = await reactionsColl
								.aggregate([{ $sample: { size: 1 } }])
								.next();
							sendMsg(random.response);
						}

						// Update the user counter
						await usersColl.updateOne(
							{
								name: username,
							},
							{
								$inc: { counter: 1 },
							}
						);
					}
					return;
				}
			}
		});
	});
}

(async () => {
	let error = null;
	while (!error) {
		try {
			await main();
		} catch (e) {
			console.error("CHECKING: ", e);
			if (e !== "RECON") {
				console.error(e);
				process.exit(1);
			}
		}
	}
})();

async function update(coll, name, response) {
	const sett = {
		name,
		response,
	};
	if (!response) delete sett.response;

	await coll.updateOne(
		{
			name,
		},
		{
			$set: sett,
		},
		{
			upsert: true,
		}
	);
}

async function del(coll, name) {
	await coll.deleteOne({ name });
}
