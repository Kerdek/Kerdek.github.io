// // import { typ_abs, typ_ref, typ_unk } from "./graph.js";
// // import { pretty_vars } from "./pretty_vars.js";
// // import { print_term, print_type } from "./print.js";
// // import { read } from "./read.js";
// // import { scanner } from "./scanner.js";
// // import { tokenizer } from "./tokenizer.js";
// // import { typecheck } from "./typecheck.js";

// // import { result } from "./function.js";
// import { TypeTree } from "./graph.js";
// import { print_type } from "./print.js";
// import { read_type } from "./read.js";
// import { scanner } from "./scanner.js";
// import { tokenizer } from "./tokenizer.js";

// // const fail = () => { throw new Error("FAIL") }

// // if ("\\x.a b" !== print_term(await read(tokenizer(scanner(' \\ x . a b ', ''))))) fail()
// // if ("a -> a" !== print_type(pretty_vars(typ_abs(typ_ref("x"), typ_ref("x"))))) fail()
// // if ("a -> (a -> b) -> b" !== print_type(pretty_vars(typecheck(await read(tokenizer(scanner('(\\a.a a) (\\x f.f x) \\di.di', ''))), typ_unk())[0]))) fail()
// // if ("{ b: a } & { a: a -> b } -> { c: b }" != print_type(pretty_vars(typecheck(await read(tokenizer(scanner('\\e.{ c:e.a e.b }', ''))), typ_unk())[0]))) fail()
// // if ("IO a -> IO b -> IO b" != print_type(pretty_vars(typecheck(await read(tokenizer(scanner('\\x y.__builtin_bind x \\_.y', ''))), typ_unk())[0]))) fail()
// // if ("{ foo: Number, bar: String } | { foo: Number, baz: Boolean }" != print_type(dnf(dnf_array(await readt(tokenizer(scanner('{ foo: Number } & ({ bar: String } | { baz: Boolean })', '')), {}))))) fail()

// const rt: (s: string) => Promise<TypeTree> = async s => await read_type(tokenizer(scanner(s, '')), {})

// const a = await rt('Number & x | Number & x')
// const r = tree_to_dnf(a)
// if (typeof r === "string") {
//   console.log(r) }
// else {
//   console.log(print_type(dnf_to_tree(r))) }
