export type ExprCall = { kind: "call", dest: Expr, opers: Expr[] }
export type ExprAccess = { kind: "access", lhs: Expr, rhs: Expr }
export type ExprAssign = { kind: "assign", lhs: Expr, rhs: Expr }
export type ExprAssignAdd = { kind: "assignadd", lhs: Expr, rhs: Expr }
export type ExprAssignSub = { kind: "assignsub", lhs: Expr, rhs: Expr }
export type ExprAssignMul = { kind: "assignmul", lhs: Expr, rhs: Expr }
export type ExprAssignDiv = { kind: "assigndiv", lhs: Expr, rhs: Expr }
export type ExprAssignMod = { kind: "assignmod", lhs: Expr, rhs: Expr }
export type ExprAssignShl = { kind: "assignshl", lhs: Expr, rhs: Expr }
export type ExprAssignShr = { kind: "assignshr", lhs: Expr, rhs: Expr }
export type ExprAssignBitAnd = { kind: "assignbitand", lhs: Expr, rhs: Expr }
export type ExprAssignBitXor = { kind: "assignbitxor", lhs: Expr, rhs: Expr }
export type ExprAssignBitOr = { kind: "assignbitor", lhs: Expr, rhs: Expr }
export type ExprAssignLogAnd = { kind: "assignlogand", lhs: Expr, rhs: Expr }
export type ExprAssignLogOr = { kind: "assignlogor", lhs: Expr, rhs: Expr }
export type ExprComma = { kind: "comma", lhs: Expr, rhs: Expr }
export type ExprPos = { kind: "pos", oper: Expr }
export type ExprNeg = { kind: "neg", oper: Expr }
export type ExprNot = { kind: "not", oper: Expr }
export type ExprBitCmp = { kind: "bitcmp", oper: Expr }
export type ExprEE = { kind: "ee", lhs: Expr, rhs: Expr }
export type ExprNE = { kind: "ne", lhs: Expr, rhs: Expr }
export type ExprGT = { kind: "gt", lhs: Expr, rhs: Expr }
export type ExprGE = { kind: "ge", lhs: Expr, rhs: Expr }
export type ExprLT = { kind: "lt", lhs: Expr, rhs: Expr }
export type ExprLE = { kind: "le", lhs: Expr, rhs: Expr }
export type ExprAdd = { kind: "add", lhs: Expr, rhs: Expr }
export type ExprSub = { kind: "sub", lhs: Expr, rhs: Expr }
export type ExprMul = { kind: "mul", lhs: Expr, rhs: Expr }
export type ExprDiv = { kind: "div", lhs: Expr, rhs: Expr }
export type ExprMod = { kind: "mod", lhs: Expr, rhs: Expr }
export type ExprShl = { kind: "shl", lhs: Expr, rhs: Expr }
export type ExprShr = { kind: "shr", lhs: Expr, rhs: Expr }
export type ExprBitAnd = { kind: "bitand", lhs: Expr, rhs: Expr }
export type ExprBitXor = { kind: "bitxor", lhs: Expr, rhs: Expr }
export type ExprBitOr = { kind: "bitor", lhs: Expr, rhs: Expr }
export type ExprLogAnd = { kind: "logand", lhs: Expr, rhs: Expr }
export type ExprLogOr = { kind: "logor", lhs: Expr, rhs: Expr }
export type ExprList = { kind: "list", opers: Expr[] }
export type ExprRef = { kind: "ref", id: string }
export type ExprLit = { kind: "lit", value: Value }

export type Expr =
  ExprCall |
  ExprAccess |
  ExprAssign |
  ExprAssignAdd |
  ExprAssignSub |
  ExprAssignMul |
  ExprAssignDiv |
  ExprAssignMod |
  ExprAssignShl |
  ExprAssignShr |
  ExprAssignBitAnd |
  ExprAssignBitXor |
  ExprAssignBitOr |
  ExprAssignLogAnd |
  ExprAssignLogOr |
  ExprComma |
  ExprPos |
  ExprNeg |
  ExprNot |
  ExprBitCmp |
  ExprEE |
  ExprNE |
  ExprGT |
  ExprGE |
  ExprLT |
  ExprLE |
  ExprAdd |
  ExprSub |
  ExprMul |
  ExprDiv |
  ExprMod |
  ExprShl |
  ExprShr |
  ExprBitAnd |
  ExprBitXor |
  ExprBitOr |
  ExprLogAnd |
  ExprLogOr |
  ExprList |
  ExprRef |
  ExprLit

export type ExprKind = Expr['kind'];

export type StmtFunction = { kind: "function", name: ExprRef | ExprLit, params: string[], body: Stmt[] }
export type StmtIf = { kind: "if", cond: Expr, then: Stmt[] }
export type StmtIfElse = { kind: "ifelse", cond: Expr, then: Stmt[], else: Stmt[] | StmtIf | StmtIfElse }
export type StmtWhile = { kind: "while", cond: Expr, body: Stmt[] }
export type StmtDoWhile = { kind: "dowhile", body: Stmt[], cond: Expr }
export type StmtFor = { kind: "for", conds: [Expr, Expr, Expr], body: Stmt[] }
export type StmtForIn = { kind: "forin", lhs: Expr, range: Expr, body: Stmt[] }
export type StmtBreak = { kind: "break" }
export type StmtContinue = { kind: "continue" }
export type StmtReturn = { kind: "return", oper: Expr }
export type StmtExpr = { kind: "expr", expr: Expr }
export type StmtEmpty = { kind: "empty" }

export type Stmt = StmtIf | StmtIfElse | StmtWhile | StmtDoWhile | StmtFor | StmtForIn | StmtBreak | StmtContinue | StmtReturn | StmtFunction | StmtExpr | StmtEmpty

export type Func = (...e: Value[]) => Value
export type Value = number | string | boolean | null | Value[] | { [i: string]: Value } | Func
