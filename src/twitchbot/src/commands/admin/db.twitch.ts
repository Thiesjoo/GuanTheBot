import { Command } from "src/helpers/types";

const commands: Command[] = [
	{
		name: "test",
		response: async () => {
			return "this is a rest resposne";
		},
	},
];
export default commands;
