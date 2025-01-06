const m = memo

const _if = m(() => a => b => c => a() ? b() : c())

const _add = m(() => a => b => a() + b())
const _sub = m(() => a => b => a() - b())
const _mul = m(() => a => b => a() * b())
const _div = m(() => a => b => a() / b())
const _mod = m(() => a => b => a() % b())
const _shl = m(() => a => b => a() << b())
const _shr = m(() => a => b => a() >> b())
const _and = m(() => a => b => a() && b())
const _or = m(() => a => b => a() || b())
const _bitand = m(() => a => b => a() & b())
const _bitxor = m(() => a => b => a() ^ b())
const _bitor = m(() => a => b => a() | b())

const _eq = m(() => a => b => a() === b())
const _neq = m(() => a => b => a() !== b())
const _gt = m(() => a => b => a() > b())
const _ge = m(() => a => b => a() >= b())
const _lt = m(() => a => b => a() < b())
const _le = m(() => a => b => a() <= b())

const _sempty = m(() => a => a().length === 0)
const _shead = m(() => a => a()[0])
const _stail = m(() => a => a().substring(1))

const _jsonstringify = m(() => a => JSON.stringify(a()))
const _jsonparse = m(() => a => JSON.parse(a()))