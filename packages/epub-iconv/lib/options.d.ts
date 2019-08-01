import { IEpubIconvOptions } from './buffer';
import { ITSValueOrArray } from 'ts-type';
export declare function handleOptions<T extends Partial<IEpubIconvOptions>, U>(opts: T, ...argv: U[]): T & U;
export declare function handlePattern(pattern: ITSValueOrArray<string>): string[];
