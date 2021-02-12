const tmi = require('tmi.js');
const dotenv = require("dotenv")
const fs = require("fs")

dotenv.config()

const client = new tmi.Client({
    identity: {
        username: "guandevbot",
        password: process.env.TMI_KEY
    },
    // options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    channels: ["madestout", "xmightywanheda"]
});

const users = ["koepoe_", "xhatios", "guanthethird", "hiervandaan", "thedejavunl", "flyingfruitcake", "gionl", "odtjethethird"]
const reactions = ["Lastig he typen?", "LEER NOU EENS TYPEN", "catJAM still can't type", "Poggies kan je nou nog steeds niet typen"]
const triggers = ["SAdge", "Saadge", "pepD", "ppeD", "SAadge", "peepd", "peepD", "PEPEd", "peped", "poggies", "PepeD", "kekw", "Dadge", "Sadge\\", "KEKw", "#Head", "5head", "MadestNo", "sadge", "Sadhe", "3head", "<3*", "<#"]

// function getCurrentDateString() {
//     var dateObj = new Date();
//     var month = dateObj.getUTCMonth() + 1; //months from 1-12
//     var day = dateObj.getUTCDate();
//     var year = dateObj.getUTCFullYear();

//     return year + "-" + month + "-" + day + ".json";
// }

// let fileName = getCurrentDateString()

// let commands = {}
// if (fs.existsSync(fileName)) {
//     commands = JSON.parse(fs.readFileSync(fileName, 'utf8'))
// }

client.connect()
    .then(_ => {
        console.log("Connected to the twitch channels: ")
        client.say("guanthethird", "/me GoewanBot is on")
    })
    .catch(console.error);


client.on('message', (channel, tags, message, self) => {
    // console.log(channel, tags, message)
    if (self) return;
    if (users.includes(tags.username)) {
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


    // const total = message.toLowerCase();

    // if (total == "!save") {
    //     fs.writeFile(fileName, JSON.stringify(commands), (err) => {
    //         if (err) {
    //             throw err;
    //         }
    //         console.log("JSON data is saved.");
    //     });
    // } else if (total == "!show") {
    //     console.log(commands)
    // } else if (message[0] === "!") {
    //     let com = message.split(" ")[0].toLowerCase()
    //     if (!(com in commands)) commands[com] = 0
    //     commands[com] += 1
    //     console.log("Command used!: ", com)
    // }
});