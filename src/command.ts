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
    opt: O.Option<Array<string>>;
}

export type Command = Command1 | Command2 | Command3


export type CommandOption = { name: string, values: string[] }
export type CommandOptionDict = Record<string, string[]>

const eitherApplicativeInstance: Applicative2<E.URI> = {
    URI: E.URI,
    ap: (fab, fa) => E.ap(fa)(fab),
    map: (fa, f) => E.map(f)(fa),
    of: E.of
}


function getCommand1Options(d: CommandOptionDict): Array<E.Either<Error, CommandOption>> {
    return [
        E.map((el: string[]) => ({ name: "o1", values: el }))(E.fromNullable(Error("Option o1 is missing"))(d["o1"])),
        E.map((el: string[]) => ({ name: "o2", values: el }))(E.fromNullable(Error("Option o2 is missing"))(d["o2"])),
    ]
}

export function xcomm1(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command1>> {
    return name != "comm1" ?
        O.none
        : O.some(pipe(
            opts,
            getCommand1Options,
            A.sequence(eitherApplicativeInstance),
            E.map(
                a => ({
                    _tag: "comm1",
                    arg: arg,
                    o1: opts["o1"][0],
                    o2: opts["o2"][0]
                })
            )
        ))
}

export function xcomm2(name: string, arg: string, opts: CommandOptionDict): O.Option<E.Either<Error, Command2>> {
    return name != "comm2" ?
        O.none
        : O.some(E.right({
            _tag: "comm2",
            arg: arg,
            o3: opts["o3"][0],
            o4: opts["o4"][0]
        }))
}

export const comms = [xcomm1, xcomm2]

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
