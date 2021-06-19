import * as C from "./command"
import * as O from "fp-ts/lib/Option"
import * as E from "fp-ts/lib/Either"
import * as IO from "fp-ts/lib/IO"
import { pipe } from "fp-ts/lib/function"
import * as NEA from "fp-ts/lib/NonEmptyArray"

describe("Command fold", () => {
    function fail(msg: NEA.NonEmptyArray<string>): void {
        expect(msg).toEqual([])
    }

    test("onCommand1: command name valid, arg valid, all options valid", () => {
        pipe(
            C.xcomm1("comm1", "arg", { o1: ["asd"], o2: ["qewr"] }),
            O.map(E.map(
                (c: C.Command) => C.fold<string>({
                    onCommand1: c => c._tag,
                    onCommand2: c => c._tag,
                    onCommand3: c => c._tag,
                }, c))

            ),
            O.fold(
                () => { fail(["x"]) },
                e => pipe(
                    e,
                    E.fold(
                        er => { fail(["y"]) },
                        a => { expect(a).toEqual("comm1") }
                    )
                )
            )
        )
    })

    test("onCommand1: command name valid, arg valid, option o1 is missing", () => {
        pipe(
            C.xcomm1("comm1", "arg", { o4: ["asd"], o2: ["qewr"] }),
            O.map(E.map(
                (c: C.Command) => C.fold<string>({
                    onCommand1: c => c._tag,
                    onCommand2: c => c._tag,
                    onCommand3: c => c._tag,
                }, c))

            ),
            O.fold(
                () => { fail(["y"]) },
                e => pipe(
                    e,
                    E.fold(
                        er => { expect(er).toEqual(Error("Option o1 is missing")) },
                        a => { fail(["x"]) }
                    )
                )
            )
        )
    })

    test("onCommand1: command name valid, arg valid, option o2 is missing", () => {
        pipe(
            C.xcomm1("comm1", "arg", { o1: ["asd"], o5: ["qewr"] }),
            O.map(E.map(
                (c: C.Command) => C.fold<string>({
                    onCommand1: c => c._tag,
                    onCommand2: c => c._tag,
                    onCommand3: c => c._tag,
                }, c))

            ),
            O.fold(
                () => { fail(["y"]) },
                e => pipe(
                    e,
                    E.fold(
                        er => { expect(er).toEqual(Error("Option o2 is missing")) },
                        a => { fail(["x"]) }
                    )
                )
            )
        )
    })

    test("onCommand1: command name valid, arg valid, option o1 and o2 are missing", () => {
        pipe(
            C.xcomm1("comm1", "arg", {}),
            O.map(E.map(
                (c: C.Command) => C.fold<string>({
                    onCommand1: c => c._tag,
                    onCommand2: c => c._tag,
                    onCommand3: c => c._tag,
                }, c))

            ),
            O.fold(
                () => { fail(["y"]) },
                e => pipe(
                    e,
                    E.fold(
                        er => { expect(er).toEqual(Error("Option o1 is missing")) },
                        a => { fail(["x"]) }
                    )
                )
            )
        )
    })


    test("onCommand1: command name invalid, arg valid, all options valid", () => {
        pipe(
            C.xcomm1("invalidcommadn", "arg", { o1: ["value3"], o2: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })


    test("should produce command1 string for Command1", () => {
        pipe(
            { _tag: "comm1", arg: "arg", o1: "", o2: "" } as C.Command1,
            c => C.fold<string>({
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }, c),
            x => { expect(x).toEqual("command1") }
        )
    })

    test("should produce command2 string for Command2", () => {
        pipe(
            { _tag: "comm2", arg: "arg", o3: "", o4: "" } as C.Command2,
            c => C.fold<string>({
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }, c),
            x => { expect(x).toEqual("command2") }
        )
    })

    test("should produce command3 string for Command3", () => {
        pipe(
            { _tag: "comm3", arg: "arg", req: "", opt: O.none } as C.Command3,
            c => C.fold<string>({
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }, c),
            x => { expect(x).toEqual("command3") }
        )
    })


})
