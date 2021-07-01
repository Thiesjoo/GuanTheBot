type ObjectKeys<T> = T extends object
	? (keyof T)[]
	: T extends number
	? []
	: T extends Array<any> | string
	? string[]
	: never;

/** Interface for typed object.keys */
export interface ObjectConstructor {
	keys<T>(o: T): ObjectKeys<T>;
}
