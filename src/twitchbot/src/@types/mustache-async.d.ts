declare module "mustache-async" {
	export const render: (
		template: string,
		view: any,
		partials?: any,
		tags?: string[]
	) => Promise<string>;
}
