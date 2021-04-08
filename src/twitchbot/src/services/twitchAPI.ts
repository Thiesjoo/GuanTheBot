import { AutoInjectable } from "src/helpers/tsyringe.reexport";
import { DatabaseService } from "./mongoDB";

@AutoInjectable()
export class TwitchAPIService {
	constructor(private db?: DatabaseService) {}
}
