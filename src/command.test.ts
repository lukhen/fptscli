import * as C from "./command"
import * as O from "fp-ts/lib/Option"
import * as E from "fp-ts/lib/Either"
import * as IO from "fp-ts/lib/IO"
import { pipe } from "fp-ts/lib/function"
import * as NEA from "fp-ts/lib/NonEmptyArray"

describe("Command fold", () => {

    test("should produce none string", () => {
        pipe(
            O.none,
            C.fold<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }),
            x => { expect(x).toEqual("none") }
        )
    })

    test("should produce error string", () => {
        pipe(
            O.some(E.left(Error(""))),
            C.fold<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }),
            x => { expect(x).toEqual("error") }
        )
    })


    test("should produce command1 string for Command1", () => {
        pipe(
            O.some(E.right({ _tag: "comm1", arg: "arg", o1: "", o2: "" } as C.Command1)),
            C.fold<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }),
            x => { expect(x).toEqual("command1") }
        )
    })

    test("should produce command2 string for Command2", () => {
        pipe(
            O.some(E.right({ _tag: "comm2", arg: "arg", o3: "", o4: "" } as C.Command2)),
            C.fold<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }),
            x => { expect(x).toEqual("command2") }
        )
    })

    test("should produce command3 string for Command3", () => {
        pipe(
            O.some(E.right({ _tag: "comm3", arg: "arg", req: "", opt: O.none } as C.Command3)),
            C.fold<string>({
                onNone: () => "none",
                onError: (e) => "error",
                onCommand1: c => "command1",
                onCommand2: c => "command2",
                onCommand3: c => "command3",
            }),
            x => { expect(x).toEqual("command3") }
        )
    })
})

describe("comm1", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            C.comm1("comm1", ["arg"], { o1: ["asd"], o2: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm1",
                            arg: "arg",
                            o1: "asd",
                            o2: "qewr"
                        } as C.Command1)))
            }
        )
    })

    test("command name valid, arg valid, option o1 is missing", () => {
        pipe(
            C.comm1("comm1", ["arg"], { o4: ["asd"], o2: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o1 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o2 is missing", () => {
        pipe(
            C.comm1("comm1", ["arg"], { o1: ["asd"], o5: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o2 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o1 and o2 are missing", () => {
        pipe(
            C.comm1("comm1", ["arg"], {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o1 is missing")))) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            C.comm1("invalidcommadn", ["arg"], { o1: ["value3"], o2: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })
})

describe("comm2", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            C.comm2("comm2", ["arg"], { o3: ["asd"], o4: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm2",
                            arg: "arg",
                            o3: "asd",
                            o4: "qewr"
                        } as C.Command2)))
            }
        )
    })

    test("command name valid, arg valid, option o3 is missing", () => {
        pipe(
            C.comm2("comm2", ["arg"], { o100: ["asd"], o4: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o3 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o4 is missing", () => {
        pipe(
            C.comm2("comm2", ["arg"], { o3: ["asd"], o100: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o4 is missing")))) }
        )
    })

    test("command name valid, arg valid, option o3 and o4 are missing", () => {
        pipe(
            C.comm2("comm2", ["arg"], {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option o3 is missing")))) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            C.comm2("invalidcommadn", ["arg"], { o3: ["value3"], o4: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })
})

describe("comm3", () => {
    test("command name valid, arg valid, all options valid", () => {
        pipe(
            C.comm3("comm3", ["arg"], { req: ["asd"], opt: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm3",
                            arg: "arg",
                            req: "asd",
                            opt: O.some("qewr")
                        } as C.Command3)))
            }
        )
    })

    test("command name valid, arg valid, option req is missing", () => {
        pipe(
            C.comm3("comm3", ["arg"], { xxx: ["asd"], opt: ["qewr"] }),
            er => { expect(er).toEqual(O.some(E.left(Error("Option req is missing")))) }
        )
    })

    test("command name valid, arg valid, option opt is missing", () => {
        pipe(
            C.comm3("comm3", ["arg"], { req: ["asd"], xxx: ["qewr"] }),
            a => {
                expect(a).toEqual(
                    O.some(
                        E.right({
                            _tag: "comm3",
                            arg: "arg",
                            req: "asd",
                            opt: O.none
                        } as C.Command3)))
            }
        )
    })

    test("command name valid, arg valid, option req and opt are missing", () => {
        pipe(
            C.comm3("comm3", ["arg"], {}),
            er => { expect(er).toEqual(O.some(E.left(Error("Option req is missing")))) }
        )
    })


    test("command name invalid, arg valid, all options valid", () => {
        pipe(
            C.comm3("invalidcommadn", ["arg"], { req: ["value3"], opt: ["value4"] }),
            x => { expect(x).toEqual(O.none) }
        )
    })
})
