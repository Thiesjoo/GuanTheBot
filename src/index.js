const tmi = require("tmi.js");
const dotenv = require("dotenv");
const exec = require("await-exec");
const Mustache = require("mustache-async");
const os = require("os")
dotenv.config();
const axios = require("axios").default
const convert = require('xml-js');
const MongoClient = require("mongodb").MongoClient;


let lastTime = 0;

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
			const sendMsg = (...rest) => client.say(channel, `@${username}, ${rest.join(' ')}`);
			if (self || username === process.env.TMI_USER) return;

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

					case "addToUser":
						const splitted2 = message.split(" ");
						const userName2 =
							splitted2.length > 1 ? splitted2[1].replace("@", "") : username;

						const amount =
							splitted2.length > 2 ? (+splitted2[2] ? +splitted2[2] : 1) : 1;

						await usersColl.updateOne(
							{ name: userName2 },
							{ $inc: { counter: amount } }
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


					case "info":
						console.log("INFO REQUESTED")
						sendMsg(os.hostname())
						console.log(process.env.WRA_KEY, `http://api.wolframalpha.com/v2/query?input=2*2&appid=${process.env.WRA_KEY}`)
						return
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

					case "cmdcounter":
						const num = parseInt(args);
						if (!num) {
							console.error("not a num", args);
							return;
						}
						await commandsColl.updateOne(
							{
								name: firstArg,
							},
							{
								$set: { counter: num },
							}
						);
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
						case "hug":
							return sendMsg(`${displayName} hugs ${firstArg} <3 cjoet`)

						case "top":
							const resultTop = await usersColl.find({}).sort([["counter", -1]]).limit(5).toArray()
							return sendMsg(resultTop.reduce((acc, val) => {
								acc += `${acc.length === 0 ? "" : " | "}${val.name} zit op ${val.counter}`
								return acc
							}, ""))

						case "counter":
							const splitted = message.split(" ");
							const userName =
								splitted?.length > 1 ? splitted[1].replace("@", "") : username;
							if (userName === "triggers") {
								sendMsg(
									`Er zijn nu al ${triggers.length} triggers in de database`
								);
								return;
							}
							const test = await usersColl.findOne({ name: userName });
							if (!test) {
								sendMsg("User niet gevonden in database");
								return;
							}
							sendMsg(
								`${userName} heeft nu al ${test.counter} iets verkeerd getypdt`
							);

							return;

						case "ask":
							if (Date.now() - lastTime < 10 * 1000) {
								sendMsg("Sorry wolfram heeft timeout. Eventjes wachten (:")
								return
							}

							const messageArgsAsks = message.split(" ")
							messageArgsAsks?.shift()
							const messageArgs = messageArgsAsks?.join(" ");

							if (!messageArgs) {
								return sendMsg("Je moet wel een vraag stellen (: ")
							}

							console.log("Args: ", encodeURIComponent(messageArgs))
							// Encode input as URI component
							// Include our appID
							// Only include Solution and Result Pods
							// Return in json and without images(Plaintext)
							const wraData = (await axios.default.get(`http://api.wolframalpha.com/v2/query?input=${encodeURIComponent(messageArgs)}&appid=${process.env.WRA_KEY}&includepodid=Solution&includepodid=Result&includepodid=Definitions&includepodid=Definition:WordData&output=json&format=plaintext&translation=true&reinterpret=true`)).data
							console.log(wraData)

							//WRA response failure
							if (!wraData || wraData?.queryresult?.error) {
								return sendMsg("YEP wolfram pakot")
							}

							//Error from WRA response
							if (wraData.queryresult.error || !wraData.queryresult.success) {
								return sendMsg("Hmmm ik begrijp je vraag niet. (Moet engels zijn (: )")
							}

							// Pods errors
							const res = wraData?.queryresult?.pods
							if (!res) {
								return sendMsg("Er is helaas geen resultaat. Of je vraag is niet goed of er is bijvoorbeeld geen reeël resultaat")
							}
							const resPod = res[0]
							if (!resPod || !resPod?.subpods || resPod?.subpods?.length < 1) {
								return sendMsg("Er is geen resultaat Sadge")
							}

							let outputString = ""
							resPod.subpods.forEach(x => {
								outputString += x.plaintext ? (outputString.length === 0 ? "" : " v ") + x.plaintext : ""
							})
							if (outputString.length > 50) {
								return sendMsg("Sorry het antwoord is te lang")
							}
							sendMsg(`Het antwoord is: ${outputString.slice(0, 50)}${outputString.length > 50 ? "..." : ""}`)
							lastTime = Date.now()
							return

						default:
							const found = await commandsColl.findOne({
								name: command,
							});
							if (!found) return;
							const secondPass = await Mustache.render(
								found.response,
								{
									count: async () => {
										return found?.counter || 0;
									},
								},
								null,
								["${", "}"]
							);

							sendMsg(secondPass);
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
