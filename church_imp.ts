import { Read, EvaluationOrder, Tree, make } from './church.ts'

export const read2: Read = x => {
  type TextPosition = [number, number]
  type Fatal = (msg: string) => never
  let text_position: TextPosition = [1, 1]
  function take(pattern: RegExp): string | null {
    const r = x.match(pattern)
    if (!r) {
      return null }
    for (let re = /\n/g, colo = 0;;) {
      const m = re.exec(r[0])
      if (!m) {
        text_position[1] += r[0].length - colo
        x = x.slice(r[0].length)
        return r[0] }
      colo = m.index + text_position[1]
      text_position[0]++ } }
  const fatal: Fatal = message => {
    throw new Error(`${text_position}: ${message}`) }
  const
    ws = /^(\s|\/\/([^\n\\]|\\[\s\S])*?(\n|$)|\/\*([^\*\\]|\\[\s\S])*?(\*\/|$))*/,
    id = /^\w[\w0-9]*/,
    sc = /^"([^"\\]|\\.)*("|$)/,
    nc = /^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/,
    tc = /^true/, fc = /^false/,
    lm = /^(\\|∀|λ)/, dt = /^\./, as = /^\*[^\*]/, ds = /^\$/, at = /^@/,
    lp = /^\(/, rp = /^\)/,
    ps = /^\+/, mn = /^-/, so = /^\//, pc = /^%/, rr = /^>>/, ll = /^<</, ee = /^\*\*/

  type Context =
    [kind: "parameter_list"] |
    [kind: "abstraction", identifier: string, evaluationOrder: EvaluationOrder] |
    [kind: "primary"] |
    [kind: "primary_complete"] |
    [kind: "parenthetical", openingLocation: TextPosition] |
    [kind: "right_associative_rhs", lhs: Tree, k: "app"] |
    [kind: "left_associative_rhs", lhs: Tree, k: "app" | "exp" | "mul" | "div" | "mod" | "add" | "sub" | "shl" | "shr", q: "exponential_lhs" | "multiplicative_lhs" | "additive_lhs" | "shift_lhs"] |
    [kind: "application"] |
    [kind: "application_lhs"] |
    [kind: "application_rhs", lhs: Tree] |
    [kind: "exponential"] |
    [kind: "exponential_lhs"] |
    [kind: "multiplicative"] |
    [kind: "multiplicative_lhs"] |
    [kind: "additive"] |
    [kind: "additive_lhs"] |
    [kind: "shift"] |
    [kind: "shift_lhs"] |
    [kind: "dollar"] |
    [kind: "dollar_lhs"] |
    [kind: "expression"]

  const contexts: Context[] = [["expression"]]
  function push(...c: Context): void {
    contexts.push(c) }

  let result!: Tree
  let did_primary!: boolean

  for (;;) {
    const context = contexts.pop()
    if (context === undefined) {
      if (x.length !== 0) {
        fatal("Expected end of file.") }
      return result }
    switch (context[0]) {
      case "parameter_list": {
        take(ws)
        if (take(dt)) {
          push("expression") }
        else {
          const o = take(as)
          take(ws)
          const i = take(id)
          if (!i) {
            fatal(`Expected \`.\` or an identifier.`) }
          push("abstraction", i, o ? "applicative" : "lazy")
          push("parameter_list") }
        continue }
      case "abstraction": {
        result = make("abs", context[1], context[2], result)
        continue }
      case "primary": {
        take(ws)
        if (take(lm)) {
          push("primary_complete")
          push("parameter_list") }
        else if (take(lp)) {
          push("primary_complete")
          push("parenthetical", [...text_position])
          push("expression") }
        else {
          let r: string | null
          did_primary = true
          if (take(at)) {
            result = make("rec") }
          else if (r = take(sc)) {
            result = make("str", JSON.parse(r)) }
          else if (r = take(nc)) {
            result = make("num", JSON.parse(r)) }
          else if (r = take(tc) || take(fc)) {
            result = make("bol", JSON.parse(r)) }
          else if (r = take(id)) {
            result = make("ref", r) }
          else {
            did_primary = false} }
        continue }
      case "primary_complete" : {
        did_primary = true
        continue }
      case "parenthetical": {
        if (!take(rp)) {
          fatal(`Expected \`)\` to match \`(\` at (${context[1]}))`) }
        continue }
      case "application" : {
        push("application_lhs")
        push("primary")
        continue }
      case "application_lhs": {
        if (!did_primary) {
          fatal("Expected an expression.") }
        else {
          push("application_rhs", result)
          push("primary") }
        continue }
      case "application_rhs": {
        if (!did_primary) {
          result = context[1] }
        else {
          result = make("app", context[1], result)
          push("application_lhs") }
        continue }
      case "left_associative_rhs": {
        result = [context[2], context[1], result] as Tree
        push(context[3])
        continue }
      case "exponential": {
        push("exponential_lhs")
        push("application")
        continue }
      case "exponential_lhs": {
        if (take(ee)) {
          push("left_associative_rhs", result, "exp", "exponential_lhs")
          push("application") }
        continue }
      case "multiplicative": {
        push("multiplicative_lhs")
        push("exponential")
        continue }
      case "multiplicative_lhs": {
        if (take(as)) {
          push("left_associative_rhs", result, "mul", "multiplicative_lhs")
          push("exponential") }
        else if (take(so)) {
          push("left_associative_rhs", result, "div", "multiplicative_lhs")
          push("exponential") }
        else if (take(pc)) {
          push("left_associative_rhs", result, "mod", "multiplicative_lhs")
          push("exponential") }
        continue }
      case "additive": {
        push("additive_lhs")
        push("multiplicative")
        continue }
      case "additive_lhs": {
        if (take(ps)) {
          push("left_associative_rhs", result, "add", "additive_lhs")
          push("multiplicative") }
        else if (take(mn)) {
          push("left_associative_rhs", result, "sub", "additive_lhs")
          push("multiplicative") }
        continue }
      case "shift": {
        push("shift_lhs")
        push("additive")
        continue }
      case "shift_lhs": {
        if (take(rr)) {
          push("left_associative_rhs", result, "shr", "shift_lhs")
          push("additive") }
        else if (take(ll)) {
          push("left_associative_rhs", result, "shl", "shift_lhs")
          push("additive") }
        continue }
      case "dollar": {
        push("dollar_lhs")
        push("shift")
        continue }
      case "dollar_lhs": {
        if (take(ds)) {
          push("right_associative_rhs", result, "app")
          push("dollar") }
        continue }
      case "right_associative_rhs": {
        result = [context[2], context[1], result] as Tree
        continue }
      case "expression": {
        push("dollar")
        continue } } } }
