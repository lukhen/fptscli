import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { sequenceT } from "fp-ts/lib/Apply";
import * as A from "fp-ts/lib/Array"
import { Applicative2 } from "fp-ts/lib/Applicative";

export interface Command1 {
    _tag: "comm1";
    arg: string;
    o1: string;
    o2: string;
}

export interface Command2 {
    _tag: "comm2";
    arg: string;
    o3: string;
    o4: string;
}
export interface Command3 {
    _tag: "comm3";
    arg: string;
    req: string;
    opt: O.Option<string>;
}

export type Command = Command1 | Command2 | Command3


export type CommandOption = { name: string, values: string[] }
export type CommandOptionDict = Record<string, string[]>

function ensureRequiredOptionsForCommand1(d: CommandOptionDict): E.Either<Error, CommandOptionDict> {
    return pipe(
        E.fromNullable(Error("Option o1 is missing"))(d["o1"]),
        E.chain(_ => E.fromNullable(Error("Option o2 is missing"))(d["o2"])),
        E.map(_ => d)
    )
}

function ensureRequiredOptionsForCommand2(d: CommandOptionDict): E.Either<Error, CommandOptionDict> {
    return pipe(
        E.fromNullable(Error("Option o3 is missing"))(d["o3"]),
        E.chain(_ => E.fromNullable(Error("Option o4 is missing"))(d["o4"])),
        E.map(_ => d)
    )
}


function ensureRequiredOptionsForCommand3(d: CommandOptionDict): E.Either<Error, CommandOptionDict> {
    return pipe(
        E.fromNullable(Error("Option req is missing"))(d["req"]),
        E.map(_ => d)
    )
}

export function comm3(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command3>> {
    return name != "comm3" ?
        O.none
        : O.some(pipe(
            opts,
            ensureRequiredOptionsForCommand3,
            E.map(
                a => ({
                    _tag: "comm3",
                    arg: arg,
                    req: a["req"][0],
                    opt: pipe(
                        O.fromNullable(a["opt"]),
                        O.map(opt => opt[0])
                    )
                })
            )
        ))
}

export function comm1(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command1>> {
    return name != "comm1" ?
        O.none
        : O.some(pipe(
            opts,
            ensureRequiredOptionsForCommand1,
            E.map(
                a => ({
                    _tag: "comm1",
                    arg: arg,
                    o1: a["o1"][0],
                    o2: a["o2"][0]
                })
            )
        ))
}

export function comm2(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command2>> {
    return name != "comm2" ?
        O.none
        : O.some(pipe(
            opts,
            ensureRequiredOptionsForCommand2,
            E.map(
                a => ({
                    _tag: "comm2",
                    arg: arg,
                    o3: a["o3"][0],
                    o4: a["o4"][0]
                })
            )
        ))
}

export const comms = [comm1, comm2]

export function fold<X>(handlers: {
    onCommand1: (c1: Command1) => X,
    onCommand2: (c2: Command2) => X,
    onCommand3: (c3: Command3) => X
}, c: Command): X {
    return c._tag == "comm1"
        ? handlers.onCommand1(c)
        : c._tag == "comm2"
            ? handlers.onCommand2(c) :
            handlers.onCommand3(c)
}
