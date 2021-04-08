"use strict";
const tmi = require("tmi.js");
const dotenv = require("dotenv");
const exec = require("await-exec");
const Mustache = require("mustache-async");
const os = require("os");
dotenv.config();
const axios = require("axios").default;
const MongoClient = require("mongodb").MongoClient;

let lastTime = 0;
console.log(process.env.QOVERY_DATABASE_MY_MONGODB_CONNECTION_URI);

async function main() {
	return new Promise(async (done, err) => {
		const db = (
			await MongoClient.connect(process.env.MONGO_URL, {
				useUnifiedTopology: true,
			})
		).db(process.env.MONGO_DB);

		// All the channels to listen for
		const listening = (await db.collection("listening").find({}).toArray()).map(
			(x) => x.name
		);

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

		/** Users collection */
		const usersColl = db.collection("users");

		/** Trigger word collection */
		const triggersColl = db.collection("triggers");
		/** Reactions to triggers */
		const reactionsColl = db.collection("reactions");

		/** Collection of commands */
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
			const sendMsg = (...rest) =>
				client.say(channel, `@${username}, ${rest.join(" ")}`);

			if (self || username === process.env.TMI_USER) return;

			const tempCommand = message
				.match(/\%\w+|\w+|"[^"]+"/g)
				?.map((x) => x.replace(/\"/g, ""));
			const command = tempCommand?.shift()?.slice(1);

			const firstArg = tempCommand?.shift();
			const args = tempCommand?.join(" ");
			const taggedUsername = firstArg ? firstArg.replace("@", "") : username;

			if (username === process.env.ADMIN_USER && message[0] === "%") {
				switch (command) {
					case "listen": {
						await updateItem(db.collection("listening"), firstArg);
						client.disconnect();
						client.removeAllListeners("message");
						err("RECON");
						break;
					}
					case "unlisten": {
						await deleteItem(db.collection("listening"), firstArg);
						client.disconnect();
						client.removeAllListeners("message");
						err("RECON");
						break;
					}

					case "resetCountersAASDTHISISRANDOMTONOTTRIGGERAUTO": {
						console.log("Resettings counter for a peerson");
						await usersColl.updateOne(
							{ name: taggedUsername },
							{ $set: { counter: 0 } }
						);
						return;
					}

					case "addToUser": {
						await usersColl.updateOne(
							{ name: taggedUsername },
							{
								$inc: {
									counter: +args || 1, // Convert the second arg to a number, or just add 1 if it is not defined
								},
							}
						);
						return;
					}

					case "dumpTHISISARANDOMSTRINGPLSNORESTORE": {
						if (process.env.NODE_ENV !== "production") {
							let res = await exec(
								`mongodump --uri="${process.env.MONGO_URL}/${process.env.MONGO_DB}"`
							);
							console.log("Result of dump: ", res);
						}
						return;
					}
					case "restoreTHISISARANDOMSTRINGPLSNORESTORE": {
						if (process.env.NODE_ENV !== "production") {
							let res = await exec(
								`mongorestore --uri="${process.env.MONGO_URL}/${process.env.MONGO_DB}" --nsFrom="twitchtestbot.*" --nsTo="${process.env.MONGO_DB}.*" dump/`
							);
							console.log("Result of restore: ", res);
							await refreshUsers();
							await refreshTriggers();
						}
						return;
					}

					case "info": {
						console.log("INFO REQUESTED", process.env);
						sendMsg(`Hostname: ${os.hostname()}`);
						return;
					}

					case "testdb": {
						try {
							let db = await MongoClient.connect(
								process.env.QOVERY_DATABASE_MY_MONGODB_CONNECTION_URI +
									"?ssl_ca_certs=/usr/src/rds-combined-ca-bundle.pem",
								{
									useUnifiedTopology: true,
								}
							);
							console.log("Conencted to db", db);
							sendMsg("test");
						} catch (e) {
							console.error(e);
						}
						return;
					}

					case "editreaction":
					case "addreaction": {
						return await updateItem(reactionsColl, firstArg, args);
					}
					case "delreaction": {
						return await deleteItem(reactionsColl, firstArg);
					}

					case "edittrigger":
					case "addtrigger": {
						await updateItem(
							triggersColl,
							firstArg,
							args.length === 0 ? null : args
						);
						await refreshTriggers();
						console.log("Added a trigger", firstArg);
						return;
					}
					case "deltrigger": {
						await deleteItem(triggersColl, firstArg);
						await refreshTriggers();
						console.log("Deleted trigger", firstArg);
						return;
					}

					case "editcmd":
					case "addcmd": {
						return await updateItem(commandsColl, firstArg, args);
					}
					case "delcmd": {
						return await deleteItem(commandsColl, firstArg);
					}

					case "cmdcounter": {
						const numberToSet = parseInt(args);
						if (!numberToSet) {
							console.error("Not a number", args);
							return;
						}
						await commandsColl.updateOne(
							{
								name: firstArg,
							},
							{
								$set: { counter: numberToSet },
							}
						);
						return;
					}

					case "trust": {
						await updateItem(usersColl, firstArg);
						await refreshUsers();
						return;
					}
					case "untrust": {
						await deleteItem(usersColl, firstArg);
						await refreshUsers();
						return;
					}
				}
			}

			if (users.find((x) => x.name === username)) {
				if (message[0] === "%") {
					switch (command) {
						case "hug": {
							return sendMsg(`${displayName} hugs ${firstArg} <3 cjoet`);
						}
						case "top": {
							const resultTop = await usersColl
								.find({})
								.sort([["counter", -1]])
								.limit(5)
								.toArray();
							return sendMsg(
								resultTop.reduce((acc, val) => {
									acc += `${acc.length === 0 ? "" : " | "}${val.name} zit op ${
										val.counter
									}`;
									return acc;
								}, "")
							);
						}

						case "omega": {
							const messageArgsAsks = message.split(" ");
							messageArgsAsks?.shift();
							const messageArgs = messageArgsAsks?.join(" ");

							sendMsg(messageArgs.replace(/o/g, " OMEGALUL "));
							return;
						}

						case "counter": {
							if (taggedUsername === "triggers") {
								sendMsg(
									`Er zijn nu al ${triggers.length} triggers in de database`
								);
								return;
							}
							const foundUser = await usersColl.findOne({
								name: taggedUsername,
							});
							if (!foundUser) {
								return sendMsg("User niet gevonden in database");
							}
							return sendMsg(
								`${taggedUsername} heeft nu al ${foundUser.counter} iets verkeerd getypdt`
							);
						}

						case "ask": {
							if (Date.now() - lastTime < 10 * 1000) {
								sendMsg("Sorry wolfram heeft timeout. Eventjes wachten (:");
								return;
							}

							const messageArgsAsks = message.split(" ");
							messageArgsAsks?.shift();
							const messageArgs = messageArgsAsks?.join(" ");

							if (!messageArgs) {
								return sendMsg("Je moet wel een vraag stellen (: ");
							}

							console.log("Args: ", encodeURIComponent(messageArgs));
							// Encode input as URI component
							// Include our appID
							// Only include Solution and Result Pods
							// Return in json and without images(Plaintext)
							const wraData = (
								await axios.default.get(
									`http://api.wolframalpha.com/v2/query?input=${encodeURIComponent(
										messageArgs
									)}&appid=${
										process.env.WRA_KEY
									}&includepodid=Solution&includepodid=Result&includepodid=Definitions&includepodid=Definition:WordData&output=json&format=plaintext&translation=true&reinterpret=true`
								)
							).data;
							console.log(wraData);

							//WRA response failure
							if (!wraData || wraData?.queryresult?.error) {
								return sendMsg("YEP wolfram pakot");
							}

							//Error from WRA response
							if (wraData.queryresult.error || !wraData.queryresult.success) {
								return sendMsg(
									"Hmmm ik begrijp je vraag niet. (Moet engels zijn (: )"
								);
							}

							// Pods errors
							const res = wraData?.queryresult?.pods;
							if (!res) {
								return sendMsg(
									"Er is helaas geen resultaat. Of je vraag is niet goed of er is bijvoorbeeld geen reeël resultaat"
								);
							}
							const resPod = res[0];
							if (!resPod || !resPod?.subpods || resPod?.subpods?.length < 1) {
								return sendMsg("Er is geen resultaat Sadge");
							}

							let outputString = "";
							resPod.subpods.forEach((x) => {
								outputString += x.plaintext
									? (outputString.length === 0 ? "" : " v ") + x.plaintext
									: "";
							});
							if (outputString.length > 50) {
								return sendMsg("Sorry het antwoord is te lang");
							}
							lastTime = Date.now();
							return sendMsg(
								`Het antwoord is: ${outputString.slice(0, 50)}${
									outputString.length > 50 ? "..." : ""
								}`
							);
						}

						default: {
							const foundCommand = await commandsColl.findOne({
								name: command,
							});
							if (!foundCommand) return;
							const parsedCommand = await Mustache.render(
								foundCommand.response,
								{
									count: async () => {
										return foundCommand?.counter || 0;
									},
								},
								null,
								["${", "}"]
							);

							sendMsg(parsedCommand);
							await commandsColl.updateOne(
								{
									name: command,
								},
								{
									$inc: { counter: 1 },
								}
							);
							return;
						}
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
			// Recon error is for restarting the application
			if (e !== "RECON") {
				console.error(e);
				process.exit(1);
			}
		}
	}
})();

/** Update a document in a collection */
async function updateItem(collection, name, value = null) {
	const objectToSet = {
		name,
		response: value,
	};
	if (!value) delete objectToSet.response;

	await collection.updateOne(
		{
			name,
		},
		{
			$set: objectToSet,
		},
		{
			upsert: true,
		}
	);
}

/** Delete item from collection */
async function deleteItem(collection, name) {
	await collection.deleteOne({ name });
}
