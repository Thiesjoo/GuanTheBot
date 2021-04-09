import { config } from "dotenv";
import "reflect-metadata";
import { container } from "tsyringe";
import { registerIOCContainer } from "./helpers/tsyringe";
import { DatabaseService } from "./services/mongoDB";
import { DBStorageService } from "./services/storageService";
import { TwitchAPIService } from "./services/twitchAPI";
import { TwitchIRCService } from "./services/twitchIRC";

const envPropsArr: (string | string[])[] = [
	["QOVERY_DATABASE_MY_MONGODB_CONNECTION_URI" || "MONGO_URL"],
	"MONGO_DB",
	"TMI_USER",
	"TMI_KEY",
	"ADMIN_USER",
];

async function main() {
	process.env.NODE_ENV === "production"
		? config()
		: config({ path: "../../.env" });

	const env = Object.keys(process.env);
	envPropsArr.forEach((x) => {
		if (
			typeof x === "string"
				? env.indexOf(x) === -1
				: !x.some((y) => env.indexOf(y) > 1)
		) {
			throw new Error(
				`Property ${
					typeof x === "string" ? x : x.join("||")
				} is not present in the .env file`
			);
		}
	});

	console.log("ENV VALIDATION SUCCESS");

	registerIOCContainer({});

	const db = container.resolve(DatabaseService);
	await db.initDb();
	console.log("DB initialized");

	const storageService = container.resolve(DBStorageService);
	await storageService.updateAll();
	console.log("Got all data");

	const ircService = container.resolve(TwitchIRCService);
	await ircService.initTwitchClient();
	console.log("IRC initialized (twitch)");

	//Init socket service
	//Init discord bot

	await ircService.listenForMessages();
	console.log("end of main");
}

process.stdin.resume(); //so the program will not close instantly

function exitHandler(
	options: { cleanup?: boolean; exit?: boolean },
	exitCode: number
) {
	console.log(options, exitCode);
	if (options.cleanup) {
		console.log("Cleaning up!");
	}
	if (exitCode || exitCode === 0) {
		console.log("Exitcode:", exitCode);
	}
	if (options.exit) {
		process.exit(exitCode);
	}
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

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
			container.reset();
		}
	}
})();
