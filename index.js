const tmi = require('tmi.js');
const dotenv = require("dotenv")
dotenv.config()
const MongoClient = require('mongodb').MongoClient;


async function main() {
    const db = (await MongoClient.connect("mongodb://db:27017", {
        useUnifiedTopology: true,
    })).db("testing")
    const listening = (await db.collection("listening").find({}).toArray())

    const client = new tmi.Client({
        identity: {
            username: process.env.TMI_USER,
            password: process.env.TMI_KEY
        },
        connection: {
            reconnect: true,
            secure: true
        },
        channels: [...listening, process.env.TMI_USER],
    });

    const usersColl = db.collection("users")

    const triggersColl = db.collection("triggers")
    const reactionsColl = db.collection("reactions")

    const commandsColl = db.collection("commands")

    await client.connect()
    console.log("Goewan bot initialized ")

    let users;
    const refreshUsers = async () => { users = await usersColl.find({}).toArray() }

    await refreshUsers()

    client.on('message', async (channel, tags, message, self) => {
        const sendMsg = (msg) => client.say(channel, msg);
        if (self) return;
        const { username } = tags
        const tempCommand = message.split(" ")
        const command = tempCommand.shift().slice(1);

        const firstArg = tempCommand.shift()
        const args = tempCommand.join(' ');

        if (username === process.env.ADMIN_USER && message[0] === "%") {
            console.log("admin")

            switch (command) {
                case "addcmd":
                    console.log(`Added command: '${firstArg}' with response '${args}'`)
                    await commandsColl.updateOne({
                        name: firstArg
                    }, {
                        $set: {
                            name: firstArg,
                            response: args,
                        }
                    }, {
                        upsert: true
                    })
                    break;
                case "delcmd":
                    await commandsColl.deleteOne({
                        name: firstArg
                    })
                    break;
                case "trust":
                    await usersColl.updateOne({
                        name: firstArg
                    }, {
                        $set: {
                            name: firstArg
                        }
                    }, {
                        upsert: true,
                    })
                    await refreshUsers()
                    break;
                case "untrust":
                    await usersColl.deleteOne({
                        name: firstArg
                    })
                    await refreshUsers()
                    break;
            }
        }

        if (users.find(x => x.name === username)) {
            // Check if command
            // Check if trigger

            const found = await commandsColl.findOne({
                name: firstArg
            })
            if (!found) return;
            sendMsg("testing");

            return


            if (triggers.some((x) => message.includes(x))) {
                const picked = reactions[Math.floor(Math.random() * reactions.length)]
                client.say(channel, `@${tags['display-name']} ${picked}`)
            } else if (message.includes("guandevbot") || message.includes("@guandevbot")) {
                client.say(channel, "Jebaited Dit is een bot 3Head")
            } else if (message.includes("RIOT") || message.includes("riot")) {
                client.say(channel, "rito is the new riot")
            } else if (message.includes("Ez clap")) {
                client.say(channel, "EZY Clap")
            } else if (message.includes("EZ clap")) {
                client.say(channel, "EZY Clap")
            }
        }





        // if (users.includes(tags.username)) {

        // }
    });

    // console.log(await users.find({}).toArray())
    // await users.updateOne({
    //     username: "koepoe_"
    // }, {
    //     $set: {
    //         username: "asd"
    //     }
    // }, {
    //     upsert: true,
    // })
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e);
        process.exit(1)
    }
})();

// const users = ["koepoe_", "xhatios", "guanthethird", "hiervandaan", "thedejavunl", "flyingfruitcake", "gionl", "odtjethethird"]
// const reactions = ["Lastig he typen?", "LEER NOU EENS TYPEN", "catJAM still can't type", "Poggies kan je nou nog steeds niet typen"]
// const triggers = ["SAdge", "Saadge", "pepD", "ppeD", "SAadge", "peepd", "peepD", "PEPEd", "peped", "poggies", "PepeD", "kekw", "Dadge", "Sadge\\", "KEKw", "#Head", "5head", "MadestNo", "sadge", "Sadhe", "3head", "<3*", "<#"]




