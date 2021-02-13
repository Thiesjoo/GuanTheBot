const tmi = require("tmi.js");
const dotenv = require("dotenv");
dotenv.config();
const MongoClient = require("mongodb").MongoClient;

async function main() {
    const db = (
        await MongoClient.connect("mongodb://db:27017", {
            useUnifiedTopology: true,
        })
    ).db("testing");
    const listening = await db.collection("listening").find({}).toArray();

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
    console.log("Goewan bot initialized ");

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
        const { username } = tags;
        const sendMsg = (msg) => client.say(channel, `@${username}, ${msg}`);
        if (self) return;

        const tempCommand = message.match(/\%\w+|\w+|"[^"]+"/g).map(x => x.replace(/\"/g, ""))
        const command = tempCommand.shift().slice(1);

        const firstArg = tempCommand.shift();
        const args = tempCommand.join(" ");

        console.log("Message command:", command, "with firstarg:", firstArg, "and the rest of the args:", args)

        if (username === process.env.ADMIN_USER && message[0] === "%") {
            switch (command) {
                case "editreaction":
                case "addreaction":
                    await update(reactionsColl, firstArg, args)
                    return;
                case "delreaction":
                    await del(reactionsColl, firstArg)
                    return;

                case "edittrigger":
                case "addtrigger":
                    await update(triggersColl, firstArg, args)
                    await refreshTriggers();
                    return;
                case "deletetrigger":
                    await del(triggersColl, firstArg)
                    await refreshTriggers();
                    return;

                case "editcmd":
                case "addcmd":
                    await update(commandsColl, firstArg, args)
                    return;
                case "delcmd":
                    await del(commandsColl, firstArg)
                    return;

                case "trust":
                    await update(usersColl, firstArg)
                    await refreshUsers();
                    return;
                case "untrust":
                    await del(usersColl, firstArg)
                    await refreshUsers();
                    return;
            }
        }

        if (users.find((x) => x.name === username)) {
            if (message[0] === "%") {
                const found = await commandsColl.findOne({
                    name: command,
                });
                if (!found) return;
                sendMsg(found.response);
            } else {
                const triggerFound = triggers.find(x =>
                    message.includes(x.name)
                )

                if (triggerFound && triggerFound.response) {
                    sendMsg(triggerFound.response)
                } else if (triggerFound) {
                    const random = await reactionsColl.aggregate(
                        [{ $sample: { size: 1 } }]
                    ).next()
                    sendMsg(random.response)
                }
                return
            }
        }
    });
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();

// const triggers = ["SAdge", "Saadge", "pepD", "ppeD", "SAadge", "peepd", "peepD", "PEPEd", "peped", "poggies", "PepeD", "kekw", "Dadge", "Sadge\\", "KEKw", "#Head", "5head", "MadestNo", "sadge", "Sadhe", "3head", "<3*", "<#"]

async function update(coll, name, val) {
    const sett = {
        name,
        response: val
    }
    if (!val) delete sett.response

    await coll.updateOne(
        {
            name,
        },
        {
            $set: sett
        },
        {
            upsert: true,
        }
    );
}

async function del(coll, name) {
    await coll.deleteOne({ name });
}