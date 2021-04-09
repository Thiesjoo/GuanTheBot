import DBCommands from "./admin/db.twitch";
import UserCommands from "./admin/users.twitch";
import ExtraCommands from "./extra/extra.twitch";

export default [...DBCommands, ...UserCommands, ...ExtraCommands];
