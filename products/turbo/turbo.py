"""
TURBO — The K-Coupling Language

A small expression-oriented language for K/R/E/T coupling computation.
Variables, control flow, user-defined functions, lists, lexical scoping,
recursion. Tree-walking evaluator. No dependencies.

Examples:
    evaluate("K(1.868)")
    evaluate("let x = 0.618 in K(x) + T(x)")
    evaluate('''
        fn coupling_strength(xs) = mean(map(K, xs))
        coupling_strength([0.5, 1.0, 1.868])
    ''')
    evaluate('''
        fn fact(n) = if n < 2 then 1 else n * fact(n - 1)
        fact(10)
    ''')

Grammar:
    program     := stmt (NEWLINE | ';' stmt)*
    stmt        := assign | fn_def | expr
    assign      := IDENT '=' expr
    fn_def      := 'fn' IDENT '(' params? ')' '=' expr
    expr        := let_expr | if_expr | logical_or
    let_expr    := 'let' IDENT '=' expr 'in' expr
    if_expr     := 'if' expr 'then' expr 'else' expr
    logical_or  := logical_and ('or' logical_and)*
    logical_and := equality ('and' equality)*
    equality    := comparison (('==' | '!=') comparison)?
    comparison  := arith (('<' | '>' | '<=' | '>=') arith)?
    arith       := term (('+' | '-') term)*
    term        := power (('*' | '/') power)*
    power       := unary ('^' power)?         (right-associative)
    unary       := ('-' | 'not') unary | call
    call        := primary ('(' args? ')')*
    primary     := NUMBER | STRING | BOOL | IDENT | '(' expr ')' | list_lit
    list_lit    := '[' (expr (',' expr)*)? ']'
"""

import re
import math


# ============================================================
# TOKENIZER
# ============================================================

class Token:
    __slots__ = ('type', 'value', 'line', 'col')

    def __init__(self, type, value, line=0, col=0):
        self.type = type
        self.value = value
        self.line = line
        self.col = col

    def __repr__(self):
        return 'Token({!r}, {!r})'.format(self.type, self.value)


KEYWORDS = {
    'let': 'LET', 'in': 'IN',
    'if': 'IF', 'then': 'THEN', 'else': 'ELSE',
    'fn': 'FN',
    'true': 'TRUE', 'false': 'FALSE',
    'and': 'AND', 'or': 'OR', 'not': 'NOT',
}

TOKEN_SPEC = [
    ('NUMBER',   r'\d+(\.\d+)?([eE][+-]?\d+)?'),
    ('STRING',   r'"[^"\n]*"'),
    ('IDENT',    r'[A-Za-z_][A-Za-z_0-9]*'),
    ('OP_EQ',    r'=='),
    ('OP_NEQ',   r'!='),
    ('OP_LE',    r'<='),
    ('OP_GE',    r'>='),
    ('ASSIGN',   r'='),
    ('LT',       r'<'),
    ('GT',       r'>'),
    ('PLUS',     r'\+'),
    ('MINUS',    r'-'),
    ('STAR',     r'\*'),
    ('SLASH',    r'/'),
    ('CARET',    r'\^'),
    ('LPAREN',   r'\('),
    ('RPAREN',   r'\)'),
    ('LBRACK',   r'\['),
    ('RBRACK',   r'\]'),
    ('COMMA',    r','),
    ('SEMI',     r';'),
    ('NEWLINE',  r'\n'),
    ('COMMENT',  r'\#[^\n]*'),
    ('SKIP',     r'[ \t\r]+'),
    ('MISMATCH', r'.'),
]
TOKEN_RE = re.compile('|'.join('(?P<{}>{})'.format(p[0], p[1]) for p in TOKEN_SPEC))


def tokenize(source):
    tokens = []
    line = 1
    line_start = 0
    for mo in TOKEN_RE.finditer(source):
        kind = mo.lastgroup
        value = mo.group()
        col = mo.start() - line_start + 1
        if kind == 'NEWLINE':
            tokens.append(Token('NEWLINE', '\n', line, col))
            line += 1
            line_start = mo.end()
            continue
        if kind in ('SKIP', 'COMMENT'):
            continue
        if kind == 'MISMATCH':
            raise SyntaxError(
                'Unexpected character {!r} at line {} col {}'.format(value, line, col)
            )
        if kind == 'NUMBER':
            value = float(value) if ('.' in value or 'e' in value or 'E' in value) else int(value)
        elif kind == 'STRING':
            value = value[1:-1]
        elif kind == 'IDENT':
            if value in KEYWORDS:
                kind = KEYWORDS[value]
        tokens.append(Token(kind, value, line, col))
    tokens.append(Token('EOF', None, line, 0))
    return tokens


# ============================================================
# AST NODES
# ============================================================

class Node:
    pass


class NumberLit(Node):
    def __init__(self, val): self.val = val


class StringLit(Node):
    def __init__(self, val): self.val = val


class BoolLit(Node):
    def __init__(self, val): self.val = val


class Ident(Node):
    def __init__(self, name, line=0): self.name = name; self.line = line


class ListLit(Node):
    def __init__(self, items): self.items = items


class BinOp(Node):
    def __init__(self, op, left, right):
        self.op = op
        self.left = left
        self.right = right


class UnaryOp(Node):
    def __init__(self, op, operand):
        self.op = op
        self.operand = operand


class Call(Node):
    def __init__(self, func, args, line=0):
        self.func = func
        self.args = args
        self.line = line


class Let(Node):
    def __init__(self, name, value, body):
        self.name = name
        self.value = value
        self.body = body


class If(Node):
    def __init__(self, cond, then, else_):
        self.cond = cond
        self.then = then
        self.else_ = else_


class Assign(Node):
    def __init__(self, name, value):
        self.name = name
        self.value = value


class FnDef(Node):
    def __init__(self, name, params, body):
        self.name = name
        self.params = params
        self.body = body


class Program(Node):
    def __init__(self, stmts):
        self.stmts = stmts


class AnonFn(Node):
    """Anonymous function expression: fn(params) = body"""
    def __init__(self, params, body):
        self.params = params
        self.body = body


# ============================================================
# PARSER (recursive descent)
# ============================================================

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self, offset=0):
        idx = self.pos + offset
        if idx >= len(self.tokens):
            return self.tokens[-1]
        return self.tokens[idx]

    def advance(self):
        tok = self.tokens[self.pos]
        self.pos += 1
        return tok

    def match(self, *types):
        if self.peek().type in types:
            return self.advance()
        return None

    def expect(self, type, msg=None):
        if self.peek().type != type:
            tok = self.peek()
            raise SyntaxError(
                'Expected {} at line {} col {}, got {}({!r}). {}'.format(
                    type, tok.line, tok.col, tok.type, tok.value, msg or ''
                )
            )
        return self.advance()

    def skip_newlines(self):
        while self.match('NEWLINE'):
            pass

    # ----- top level -----

    def parse_program(self):
        stmts = []
        self.skip_newlines()
        while self.peek().type != 'EOF':
            stmts.append(self.parse_stmt())
            if self.peek().type in ('NEWLINE', 'SEMI'):
                while self.match('NEWLINE', 'SEMI'):
                    pass
            elif self.peek().type == 'EOF':
                break
            else:
                tok = self.peek()
                raise SyntaxError(
                    'Expected newline or ; at line {} col {}, got {}'.format(
                        tok.line, tok.col, tok.type
                    )
                )
        return Program(stmts)

    def parse_stmt(self):
        # Named fn definition: `fn name(args) = body`
        # Anonymous fn `fn(args) = body` is an expression — falls through.
        if self.peek().type == 'FN' and self.peek(1).type == 'IDENT':
            return self.parse_fn_def()
        # IDENT '=' expr is assign; everything else is expr.
        if self.peek().type == 'IDENT' and self.peek(1).type == 'ASSIGN':
            name = self.advance().value
            self.advance()  # =
            value = self.parse_expr()
            return Assign(name, value)
        return self.parse_expr()

    def parse_fn_def(self):
        self.advance()  # fn
        name = self.expect('IDENT').value
        self.expect('LPAREN')
        params = []
        if self.peek().type != 'RPAREN':
            params.append(self.expect('IDENT').value)
            while self.match('COMMA'):
                params.append(self.expect('IDENT').value)
        self.expect('RPAREN')
        self.expect('ASSIGN')
        self.skip_newlines()
        body = self.parse_expr()
        return FnDef(name, params, body)

    def parse_anon_fn(self):
        """Anonymous function: fn(params) = expr — usable in any expr position."""
        self.advance()  # fn
        self.expect('LPAREN')
        params = []
        if self.peek().type != 'RPAREN':
            params.append(self.expect('IDENT').value)
            while self.match('COMMA'):
                params.append(self.expect('IDENT').value)
        self.expect('RPAREN')
        self.expect('ASSIGN')
        self.skip_newlines()
        body = self.parse_expr()
        return AnonFn(params, body)

    # ----- expressions -----

    def parse_expr(self):
        if self.peek().type == 'LET':
            return self.parse_let()
        if self.peek().type == 'IF':
            return self.parse_if()
        return self.parse_or()

    def parse_let(self):
        self.advance()  # let
        name = self.expect('IDENT').value
        self.expect('ASSIGN')
        self.skip_newlines()
        value = self.parse_expr()
        self.skip_newlines()
        self.expect('IN')
        self.skip_newlines()
        body = self.parse_expr()
        return Let(name, value, body)

    def parse_if(self):
        self.advance()  # if
        self.skip_newlines()
        cond = self.parse_expr()
        self.skip_newlines()
        self.expect('THEN')
        self.skip_newlines()
        then = self.parse_expr()
        self.skip_newlines()
        self.expect('ELSE')
        self.skip_newlines()
        else_ = self.parse_expr()
        return If(cond, then, else_)

    def parse_or(self):
        left = self.parse_and()
        while self.match('OR'):
            right = self.parse_and()
            left = BinOp('or', left, right)
        return left

    def parse_and(self):
        left = self.parse_equality()
        while self.match('AND'):
            right = self.parse_equality()
            left = BinOp('and', left, right)
        return left

    def parse_equality(self):
        left = self.parse_comparison()
        op = self.match('OP_EQ', 'OP_NEQ')
        if op:
            right = self.parse_comparison()
            return BinOp(op.type, left, right)
        return left

    def parse_comparison(self):
        left = self.parse_arith()
        op = self.match('LT', 'GT', 'OP_LE', 'OP_GE')
        if op:
            right = self.parse_arith()
            return BinOp(op.type, left, right)
        return left

    def parse_arith(self):
        left = self.parse_term()
        while True:
            op = self.match('PLUS', 'MINUS')
            if not op:
                break
            right = self.parse_term()
            left = BinOp(op.value, left, right)
        return left

    def parse_term(self):
        left = self.parse_power()
        while True:
            op = self.match('STAR', 'SLASH')
            if not op:
                break
            right = self.parse_power()
            left = BinOp(op.value, left, right)
        return left

    def parse_power(self):
        left = self.parse_unary()
        if self.match('CARET'):
            right = self.parse_power()  # right-associative
            return BinOp('^', left, right)
        return left

    def parse_unary(self):
        op = self.match('MINUS', 'NOT')
        if op:
            operand = self.parse_unary()
            return UnaryOp('-' if op.type == 'MINUS' else 'not', operand)
        return self.parse_call()

    def parse_call(self):
        node = self.parse_primary()
        while self.peek().type == 'LPAREN':
            line = self.peek().line
            self.advance()  # (
            self.skip_newlines()
            args = []
            if self.peek().type != 'RPAREN':
                args.append(self.parse_expr())
                while self.match('COMMA'):
                    self.skip_newlines()
                    args.append(self.parse_expr())
            self.skip_newlines()
            self.expect('RPAREN')
            node = Call(node, args, line)
        return node

    def parse_primary(self):
        tok = self.peek()
        # let, if, and anonymous fn are expressions — usable as primaries
        # inside larger exprs. (Right-associative; bind weakly in their bodies.)
        if tok.type == 'LET':
            return self.parse_let()
        if tok.type == 'IF':
            return self.parse_if()
        if tok.type == 'FN':
            return self.parse_anon_fn()
        if tok.type == 'NUMBER':
            self.advance()
            return NumberLit(tok.value)
        if tok.type == 'STRING':
            self.advance()
            return StringLit(tok.value)
        if tok.type == 'TRUE':
            self.advance()
            return BoolLit(True)
        if tok.type == 'FALSE':
            self.advance()
            return BoolLit(False)
        if tok.type == 'IDENT':
            self.advance()
            return Ident(tok.value, tok.line)
        if tok.type == 'LPAREN':
            self.advance()
            self.skip_newlines()
            expr = self.parse_expr()
            self.skip_newlines()
            self.expect('RPAREN')
            return expr
        if tok.type == 'LBRACK':
            self.advance()
            self.skip_newlines()
            items = []
            if self.peek().type != 'RBRACK':
                items.append(self.parse_expr())
                while self.match('COMMA'):
                    self.skip_newlines()
                    items.append(self.parse_expr())
            self.skip_newlines()
            self.expect('RBRACK')
            return ListLit(items)
        raise SyntaxError(
            'Unexpected token {}({!r}) at line {} col {}'.format(
                tok.type, tok.value, tok.line, tok.col
            )
        )


# ============================================================
# EVALUATOR
# ============================================================

class Env:
    """Lexical environment with parent chain."""

    def __init__(self, parent=None, bindings=None):
        self.parent = parent
        self.bindings = bindings if bindings is not None else {}

    def get(self, name):
        if name in self.bindings:
            return self.bindings[name]
        if self.parent is not None:
            return self.parent.get(name)
        raise NameError('Undefined identifier: {}'.format(name))

    def set(self, name, value):
        self.bindings[name] = value

    def child(self, bindings=None):
        return Env(self, bindings if bindings is not None else {})


class Closure:
    """User-defined function with captured environment."""

    def __init__(self, params, body, env, name=None):
        self.params = params
        self.body = body
        self.env = env
        self.name = name or '<anon>'

    def __repr__(self):
        return '<fn {}({})>'.format(self.name, ', '.join(self.params))


# ----- framework primitives -----

def _to_num(x):
    if isinstance(x, bool):
        return float(x)
    if isinstance(x, (int, float)):
        return float(x)
    raise TypeError('Expected number, got {}'.format(type(x).__name__))


def k_func(x):
    x = _to_num(x)
    return x / (1 + x)


def r_func(x):
    x = _to_num(x)
    return 1 / (1 + 1 / max(0.001, x))


def e_func(x):
    return _to_num(x) * 2.87e-21  # Landauer: kT*ln(2) at 300K


def t_func(x):
    x = _to_num(x)
    return max(0.0, k_func(x) - r_func(x))


PHI = (1 + math.sqrt(5)) / 2
INV_PHI = 1 / PHI
K_C = 1.868122             # 256 * alpha, the coupling ceiling
K_BKT = 2 / math.pi        # BKT critical coupling
ALPHA = 1 / 137.036         # fine structure constant


# ----- stdlib -----

def _as_list(x, op):
    if not isinstance(x, list):
        raise TypeError('{}: expected list, got {}'.format(op, type(x).__name__))
    return x


def stdlib_map(f, lst):
    lst = _as_list(lst, 'map')
    if not callable(f) and not isinstance(f, Closure):
        raise TypeError('map: first arg must be a function')
    return [_apply(f, [x]) for x in lst]


def stdlib_reduce(f, lst, *rest):
    lst = _as_list(lst, 'reduce')
    if rest:
        acc = rest[0]
        items = lst
    else:
        if not lst:
            raise ValueError('reduce: empty list and no initial value')
        acc = lst[0]
        items = lst[1:]
    for x in items:
        acc = _apply(f, [acc, x])
    return acc


def stdlib_filter(f, lst):
    lst = _as_list(lst, 'filter')
    out = []
    for x in lst:
        if _is_truthy(_apply(f, [x])):
            out.append(x)
    return out


def stdlib_range(*args):
    if len(args) == 1:
        return list(range(int(args[0])))
    if len(args) == 2:
        return list(range(int(args[0]), int(args[1])))
    if len(args) == 3:
        a, b, step = float(args[0]), float(args[1]), float(args[2])
        if step == 0:
            raise ValueError('range: step cannot be 0')
        out = []
        cur = a
        if step > 0:
            while cur < b:
                out.append(cur)
                cur += step
        else:
            while cur > b:
                out.append(cur)
                cur += step
        return out
    raise TypeError('range: 1, 2, or 3 args expected, got {}'.format(len(args)))


def stdlib_sum(lst):
    return sum(_as_list(lst, 'sum'))


def stdlib_product(lst):
    p = 1
    for x in _as_list(lst, 'product'):
        p *= x
    return p


def stdlib_mean(lst):
    lst = _as_list(lst, 'mean')
    if not lst:
        raise ValueError('mean: empty list')
    return sum(lst) / len(lst)


def stdlib_length(x):
    if isinstance(x, (list, str)):
        return len(x)
    raise TypeError('length: expected list or string, got {}'.format(type(x).__name__))


def stdlib_head(lst):
    lst = _as_list(lst, 'head')
    if not lst:
        raise ValueError('head: empty list')
    return lst[0]


def stdlib_tail(lst):
    lst = _as_list(lst, 'tail')
    return lst[1:]


def stdlib_append(lst, x):
    lst = _as_list(lst, 'append')
    return lst + [x]


def stdlib_concat(a, b):
    return _as_list(a, 'concat') + _as_list(b, 'concat')


def stdlib_max(*args):
    if len(args) == 1 and isinstance(args[0], list):
        return max(args[0])
    return max(args)


def stdlib_min(*args):
    if len(args) == 1 and isinstance(args[0], list):
        return min(args[0])
    return min(args)


def stdlib_print(*args):
    # Side-effect helper. Returns last arg so it composes in expressions.
    print(*args)
    return args[-1] if args else None


# ----- coupling-specific built-ins -----

def stdlib_kuramoto_R(thetas):
    """Kuramoto order parameter: R = |⟨exp(iθ)⟩|, the sync magnitude."""
    thetas = _as_list(thetas, 'kuramoto_R')
    if not thetas:
        return 0.0
    n = len(thetas)
    cx = sum(math.cos(_to_num(t)) for t in thetas) / n
    sy = sum(math.sin(_to_num(t)) for t in thetas) / n
    return math.sqrt(cx * cx + sy * sy)


def stdlib_phase_diff(a, b):
    """Phase difference wrapped to (-pi, pi]."""
    d = _to_num(a) - _to_num(b)
    d = d % (2 * math.pi)
    if d > math.pi:
        d -= 2 * math.pi
    return d


def stdlib_entropy(ps):
    """Shannon entropy of a probability distribution (in nats).

    Accepts either a list of probabilities (must sum to ~1) or a list of
    counts (normalized internally).
    """
    ps = _as_list(ps, 'entropy')
    if not ps:
        return 0.0
    total = sum(_to_num(p) for p in ps)
    if total <= 0:
        return 0.0
    h = 0.0
    for p in ps:
        p = _to_num(p) / total
        if p > 0:
            h -= p * math.log(p)
    return h


def stdlib_fib(n):
    """n-th Fibonacci number."""
    n = int(_to_num(n))
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def _apply(func, args):
    if isinstance(func, Closure):
        if len(args) != len(func.params):
            raise TypeError(
                '{}: expected {} args, got {}'.format(func.name, len(func.params), len(args))
            )
        new_env = func.env.child(dict(zip(func.params, args)))
        return evaluate_node(func.body, new_env)
    if callable(func):
        return func(*args)
    raise TypeError('Not callable: {}'.format(type(func).__name__))


def _is_truthy(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return v != 0
    if isinstance(v, str):
        return len(v) > 0
    if isinstance(v, list):
        return len(v) > 0
    if isinstance(v, Closure):
        return True
    return v is not None


BUILTINS = {
    # Framework primitives
    'K': k_func, 'R': r_func, 'E': e_func, 'T': t_func,
    # Constants
    'phi': PHI, 'pi': math.pi, 'e': math.e,
    'K_c': K_C, 'K_BKT': K_BKT, 'INV_PHI': INV_PHI, 'alpha': ALPHA,
    # Math
    'abs': abs,
    'sqrt': lambda x: math.sqrt(_to_num(x)),
    'exp': lambda x: math.exp(_to_num(x)),
    'log': lambda x: math.log(_to_num(x)),
    'sin': lambda x: math.sin(_to_num(x)),
    'cos': lambda x: math.cos(_to_num(x)),
    'tan': lambda x: math.tan(_to_num(x)),
    'floor': lambda x: math.floor(_to_num(x)),
    'ceil': lambda x: math.ceil(_to_num(x)),
    'round': lambda x, d=0: round(_to_num(x), int(d)),
    # Aggregates
    'max': stdlib_max, 'min': stdlib_min,
    'sum': stdlib_sum, 'product': stdlib_product, 'mean': stdlib_mean,
    # Higher-order
    'map': stdlib_map, 'reduce': stdlib_reduce, 'filter': stdlib_filter,
    # List ops
    'length': stdlib_length, 'head': stdlib_head, 'tail': stdlib_tail,
    'append': stdlib_append, 'concat': stdlib_concat, 'range': stdlib_range,
    # IO
    'print': stdlib_print,
    # Coupling-specific
    'kuramoto_R': stdlib_kuramoto_R, 'phase_diff': stdlib_phase_diff,
    'entropy': stdlib_entropy, 'fib': stdlib_fib,
}


def evaluate_node(node, env):
    if isinstance(node, NumberLit):
        return node.val
    if isinstance(node, StringLit):
        return node.val
    if isinstance(node, BoolLit):
        return node.val
    if isinstance(node, Ident):
        return env.get(node.name)
    if isinstance(node, ListLit):
        return [evaluate_node(x, env) for x in node.items]
    if isinstance(node, UnaryOp):
        v = evaluate_node(node.operand, env)
        if node.op == '-':
            return -v
        if node.op == 'not':
            return not _is_truthy(v)
        raise RuntimeError('Unknown unary op: {}'.format(node.op))
    if isinstance(node, BinOp):
        op = node.op
        # short-circuit logical ops
        if op == 'and':
            l = evaluate_node(node.left, env)
            if not _is_truthy(l):
                return l
            return evaluate_node(node.right, env)
        if op == 'or':
            l = evaluate_node(node.left, env)
            if _is_truthy(l):
                return l
            return evaluate_node(node.right, env)
        l = evaluate_node(node.left, env)
        r = evaluate_node(node.right, env)
        if op == '+':
            # number + number or list + list (concat)
            if isinstance(l, list) and isinstance(r, list):
                return l + r
            return l + r
        if op == '-':
            return l - r
        if op == '*':
            return l * r
        if op == '/':
            return l / r
        if op == '^':
            return l ** r
        if op == 'OP_EQ':
            return l == r
        if op == 'OP_NEQ':
            return l != r
        if op == 'LT':
            return l < r
        if op == 'GT':
            return l > r
        if op == 'OP_LE':
            return l <= r
        if op == 'OP_GE':
            return l >= r
        raise RuntimeError('Unknown binop: {}'.format(op))
    if isinstance(node, Call):
        func = evaluate_node(node.func, env)
        args = [evaluate_node(a, env) for a in node.args]
        return _apply(func, args)
    if isinstance(node, Let):
        val = evaluate_node(node.value, env)
        new_env = env.child({node.name: val})
        return evaluate_node(node.body, new_env)
    if isinstance(node, If):
        cond = evaluate_node(node.cond, env)
        return evaluate_node(node.then if _is_truthy(cond) else node.else_, env)
    if isinstance(node, Assign):
        val = evaluate_node(node.value, env)
        env.set(node.name, val)
        return val
    if isinstance(node, FnDef):
        closure = Closure(node.params, node.body, env, node.name)
        env.set(node.name, closure)
        return closure
    if isinstance(node, AnonFn):
        return Closure(node.params, node.body, env, '<anon>')
    raise RuntimeError('Unknown node type: {}'.format(type(node).__name__))


def evaluate_program(program, env):
    result = None
    for stmt in program.stmts:
        result = evaluate_node(stmt, env)
    return result


# ============================================================
# PUBLIC API
# ============================================================

def _new_global_env(extra=None):
    bindings = dict(BUILTINS)
    if extra:
        bindings.update(extra)
    return Env(bindings=bindings)


def evaluate(source, env=None):
    """Evaluate a Turbo program. Returns the value of the last expression.

    Args:
        source: Turbo source code (str)
        env: optional Env instance OR dict of extra bindings to merge with builtins.
    """
    if env is None:
        env = _new_global_env()
    elif isinstance(env, dict):
        env = _new_global_env(env)
    elif not isinstance(env, Env):
        raise TypeError('env must be Env, dict, or None')
    tokens = tokenize(source)
    parser = Parser(tokens)
    program = parser.parse_program()
    return evaluate_program(program, env)


def parse(source):
    """Parse a Turbo program without evaluating. Returns AST (Program node)."""
    tokens = tokenize(source)
    return Parser(tokens).parse_program()


# ----- backward compatibility -----

def run(expression):
    """Evaluate an expression. Returns {'expression', 'result'} or {'expression', 'error'}.

    Backward-compatible with v1 turbo. Accepts full Turbo programs now too.
    """
    try:
        result = evaluate(expression)
        if isinstance(result, (int, float)):
            result = float(result)
        return {'expression': expression, 'result': result}
    except Exception as exc:
        return {'expression': expression, 'error': str(exc)}


def compile_k(expression):
    """Parse without evaluating. Returns {'expression', 'compiled'} or error.

    Backward-compatible with v1 turbo. Lexes and parses; no evaluation.
    """
    try:
        parse(expression)
        return {'expression': expression, 'compiled': True}
    except Exception as exc:
        return {'expression': expression, 'error': str(exc)}


__all__ = [
    'evaluate', 'parse', 'run', 'compile_k',
    'Env', 'Closure', 'BUILTINS',
    'K_C', 'K_BKT', 'PHI', 'INV_PHI', 'ALPHA',
]
