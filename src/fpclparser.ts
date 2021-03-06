import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as A from "fp-ts/lib/Array";
import * as R from "fp-ts/lib/Record";
import { sequenceT } from "fp-ts/lib/Apply";
import { Applicative2 } from "fp-ts/lib/Applicative";


export function parseArgv<A>(comms: CommandConstructor<any>[]): (argv: Array<string>) => E.Either<string[], A> {
    return argv => pipe(
        comms,
        A.map(comm => comm(parseArgv2(argv))),
        A.filter(e => E.isRight(e)),
        x => A.isEmpty(x) ? E.left(["wrong name"]) : x[0]
    );
}

/**
   Produce [name, args, opts] from argv.
   Element 0 in argv is always expected to be the command name.
**/
export function parseArgv2(argv: string[]): [string, string[], CommandOptionDict] {
    return argv.length == 0
        ? ["", [], {}]
        : [argv[0], getArgs(argv), getOptionDict(getAllOptionList(argv))]
}

type ParsedCommandHasName = (name: string) => (parsedCommand: [string, string[], CommandOptionDict]) =>
    E.Either<string[], [string, string[], CommandOptionDict]>

export const parsedCommandHasName: ParsedCommandHasName = function(n) {
    return ([name, args, opts]) => n == name ? E.right([name, args, opts]) : E.left(["wrong name"])
}

type EnsureParsedCommandArgsSize = (argsSize: number) => (parsedCommand: [string, string[], CommandOptionDict]) =>
    E.Either<string[], [string, string[], CommandOptionDict]>

export const ensureParsedCommandArgsSize: EnsureParsedCommandArgsSize = function(as) {
    return ([name, args, opts]) => pipe(
        args,
        ensureSize(as),
        E.map(args => [name, args, opts])
    )
}

type EnsureParsedCommandOpts = (reqOpts: string[]) => (parsedCommand: [string, string[], CommandOptionDict]) =>
    E.Either<string[], [string, string[], CommandOptionDict]>

export const ensureParsedCommandOpts: EnsureParsedCommandOpts = function(reqOpts) {
    return ([name, args, opts]) => pipe(
        opts,
        ensureOpts(reqOpts),
        E.map(opts => [name, args, opts])
    )
}

export function getAllOptionList(argv: string[]): CommandOption[] {
    return pipe(
        argv,
        A.reduce(
            [],
            (soFar: CommandOption[], nextEl) => pipe(
                nextEl,
                E.fromPredicate(isOption, el => el),
                E.fold(
                    el => pipe(
                        soFar,
                        explodeTailTip,
                        ({ body, tailTip }) => O.fold(
                            () => [...body],
                            (co: CommandOption) => [
                                ...body,
                                { ...co, values: A.append(el)(co.values) }
                            ]
                        )(tailTip)
                    ),
                    el => [...soFar, { name: el.slice(2), values: [] }]
                )

            )
        )
    );
}
/**
Separate the last element of the list, unless it's empty.
**/
export function explodeTailTip<A>(arr: Array<A>): { body: Array<A>; tailTip: O.Option<A>; } {
    return { body: arr.slice(0, arr.length - 1), tailTip: O.fromNullable(arr[arr.length - 1]) };
}
/**
   Produce O.some if argv contains optName option, otherwise produce Option.none
**/
export function getOpt(argv: string[]): (optName: string) => O.Option<Array<string>> {
    return optName => O.fromNullable(getOptionDict(getAllOptionList(argv))[optName]);
}
export function getOptionDict(cos: CommandOption[]): CommandOptionDict {
    return R.fromFoldableMap(
        { concat: (x: string[], y: string[]) => [...x, ...y] },
        A.Foldable
    )(cos, co => [co.name, co.values]);
}

export function getArgs(argv: string[]): string[] {

    function sliceToTheFirstOption(ss: string[]): string[] {
        return pipe(
            ss,
            O.fromPredicate(() => ss.length > 0),
            O.fold(
                () => [],
                ss => isOption(ss[0])
                    ? sliceToTheFirstOption([])
                    : [ss[0]].concat(sliceToTheFirstOption(ss.slice(1)))
            )
        );
    }

    return pipe(
        argv,
        O.fromPredicate(() => argv.length > 1),
        O.fold(
            () => [],
            argv => sliceToTheFirstOption(argv.slice(1))
        )
    );
}

function isOption(s: string) {
    return s.startsWith("--");
}

export interface CommandMeta<A> {
    tagOfA: string,
    argCount: number,
    reqOpts: string[],
    innerConstructor: InnerConstructor<A>
}


export type InnerConstructor<A> = (d: [string, string[], CommandOptionDict]) => E.Either<string[], A>

/**
   Produce a function that produces a CommandAbs from CommandData
**/
export function getConstructor<A>(commandMeta: CommandMeta<A>): CommandConstructor<A> {
    return ([name, args, opts]) => pipe(
        [name, args, opts],
        parsedCommandHasName(commandMeta.tagOfA),
        E.chain(ensureParsedCommandOpts(commandMeta.reqOpts)),
        E.chain(ensureParsedCommandArgsSize(commandMeta.argCount)),
        E.chain(commandMeta.innerConstructor)
    )
}

export type CommandData = [
    string,
    string[],
    CommandOptionDict
]


/**
 ...
**/
export type CommandConstructor<A> = (commandData: CommandData) => E.Either<string[], A>;


/**
A single command option in argv, name is option's name, and values is option's value.
 - if values length is > 1: option has multiple values
 - if values length is = 1: option has a single value
 - if values length is = 0: option is a flag

Examples:
const o1: CommandOption = {name: "o1", values: ['val1', 'val2']} // multiple values
const o2: CommandOption = {name: "o2", values: ['val3']}         // single value 
const o3: CommandOption = {name: "o3", values: []}               // flag
**/
export type CommandOption = { name: string, values: string[] }


/**
Hash map of all options in argv, where the key is an option's name, and the value is an option's value:
 - if array's length is > 1: option has multiple values
 - if array's length is = 1: option has a single value
 - if array's length is = 0: option is a flag

Example: 
For argv = ["--o1", "val1", "val2", "--o2", "val3", "--o3"]
CommandOptionDict should look like this:
const optDict: CommandOptionDict = {
    o1: ['val1', 'val2'], //multiple
    o2: ['val3'],         // single
    o3: []                // flag
}
**/
export type CommandOptionDict = Record<string, string[]>

export const e: Applicative2<E.URI> = {
    URI: E.URI,
    ap: (fab, fa) => E.ap(fa)(fab),
    map: (fa, f) => E.map(f)(fa),
    of: E.of
}

/**
   Produce Either.right if d contains optNames, otherwise produce Either.left
**/
export function ensureOpts(optNames: string[]): (d: CommandOptionDict) => E.Either<string[], CommandOptionDict> {
    return d => pipe(
        optNames,
        A.map(optName => [optName, d[optName]] as [string, string[] | undefined]),
        A.map(([optName, opt]) => E.fromNullable([`Option ${optName} is missing`])(opt)),
        A.sequence(e),
        E.map(_ => d)
    );
}

/**
   Produce Either.right is ss length is n, otherwise produce Either.left
**/
function ensureSize(n: number): (ss: string[]) => E.Either<string[], string[]> {
    return ss => pipe(
        ss,
        E.fromPredicate(
            (x) => x.length == n,
            () => ["Invalid number of args"]
        )
    );
}

export function getEitherFoldable4Instance<A, B, C, D>(preds: {
    isA: (c: A | B | C | D) => c is A,
    isB: (c: A | B | C | D) => c is B,
    isC: (c: A | B | C | D) => c is C
    isD: (c: A | B | C | D) => c is D
}): {
    fold: <X>(handlers: {
        onError: (e: string[]) => X,
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
        onD: (c: D) => X
    }) => (c: E.Either<string[], A | B | C | D>) => X,
    map: <X>(handlers: {
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
        onD: (c: D) => X
    }) => (xe: E.Either<string[], A | B | C | D>) => E.Either<string[], X>
} {
    return {
        fold: handlers => c => pipe(
            c,
            E.fold(
                handlers.onError,
                c => preds.isA(c)
                    ? handlers.onA(c)
                    : preds.isB(c)
                        ? handlers.onB(c) :
                        preds.isC(c)
                            ? handlers.onC(c) :
                            handlers.onD(c)
            )
        ),
        map: handlers => xe => E.map((c: A | B | C | D) =>
            preds.isA(c) ? handlers.onA(c)
                : preds.isB(c) ? handlers.onB(c) :
                    preds.isC(c) ? handlers.onC(c) :
                        handlers.onD(c))(xe)

    }
}


export function getEitherFoldable3Instance<A, B, C>(preds: {
    isA: (c: A | B | C) => c is A,
    isB: (c: A | B | C) => c is B,
    isC: (c: A | B | C) => c is C
}): {
    fold: <X>(handlers: {
        onError: (e: string[]) => X,
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
    }) => (c: E.Either<string[], A | B | C>) => X,
    map: <X>(handlers: {
        onA: (c: A) => X,
        onB: (c: B) => X,
        onC: (c: C) => X,
    }) => (xe: E.Either<string[], A | B | C>) => E.Either<string[], X>
} {
    return {
        fold: handlers => c => pipe(
            c,
            E.fold(
                handlers.onError,
                c => preds.isA(c)
                    ? handlers.onA(c)
                    : preds.isB(c)
                        ? handlers.onB(c) :
                        handlers.onC(c)
            )
        ),
        map: handlers => xe => E.map((c: A | B | C) =>
            preds.isA(c) ? handlers.onA(c)
                : preds.isB(c) ? handlers.onB(c) :
                    handlers.onC(c))(xe)
    }
}


export function getEitherFoldable2Instance<A, B>(preds: {
    isA: (c: A | B) => c is A,
    isB: (c: A | B) => c is B,
}): {
    fold: <X>(handlers: {
        onError: (e: string[]) => X,
        onA: (c: A) => X,
        onB: (c: B) => X,
    }) => (c: E.Either<string[], A | B>) => X,
    map: <X>(handlers: {
        onA: (c: A) => X,
        onB: (c: B) => X,
    }) => (xe: E.Either<string[], A | B>) => E.Either<string[], X>
} {
    return {
        fold: handlers => c => pipe(
            c,
            E.fold(
                handlers.onError,
                c => preds.isA(c)
                    ? handlers.onA(c) :
                    handlers.onB(c)
            )
        ),
        map: handlers => xe => E.map((c: A | B) =>
            preds.isA(c) ? handlers.onA(c)
                : handlers.onB(c))(xe)
    }
}
