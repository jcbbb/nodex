const TOKEN_HASH = Symbol("hash")
const TOKEN_END = Symbol("end")
const TOKEN_SYMBOL = Symbol("symbol")
const TOKEN_INVALID = Symbol("invalid")
const TOKEN_COMMENT = Symbol("comment")
const TOKEN_OPENPAREN = Symbol("openparen")
const TOKEN_CLOSEPAREN = Symbol("closeparen")
const TOKEN_OPENCURLY = Symbol("opencurly")
const TOKEN_CLOSECURLY = Symbol("closecurly")
const TOKEN_SEMICOLON = Symbol("semicolon")
const TOKEN_NUMBER = Symbol("number")
const TOKEN_STRING = Symbol("string")
const TOKEN_KEYWORD = Symbol("keyword")
const TOKEN_DIVISION = Symbol("division")
const TOKEN_PLUS = Symbol("plus")
const TOKEN_MINUS = Symbol("minus")
const TOKEN_MULTIPLY = Symbol("multiply")

const LITERAL_TOKENS = [
  { value: "(", kind: TOKEN_OPENPAREN },
  { value: ")", kind: TOKEN_CLOSEPAREN },
  { value: "{", kind: TOKEN_OPENCURLY },
  { value: "}", kind: TOKEN_CLOSECURLY },
  { value: ";", kind: TOKEN_SEMICOLON },
  { value: "+", kind: TOKEN_PLUS },
  { value: "/", kind: TOKEN_DIVISION },
  { value: "-", kind: TOKEN_MINUS },
  { value: "*", kind: TOKEN_MULTIPLY },
]

const KEYWORDS = [
  "auto", "const", "double", "float", "int", "short", "struct", "unsigned", "break",
  "continue", "else", "for", "long", "signed", "switch", "void", "case", "default",
  "enum", "goto", "register", "sizeof", "typedef", "volatile", "char", "do", "extern",
  "if", "return", "static", "union", "while"
]

class Lexer {
  constructor({ src, bol = 0, cursor = 0, line = 0 } = {}) {
    this.src = src;
    this.bol = bol
    this.cursor = cursor
    this.line = line
  }

  next() {
    this.trimLeft()
    let token = new Token({ kind: TOKEN_END })

    if (this.cursor >= this.src.length) return token

    if (this.src[this.cursor] === '#') {
      token.kind = TOKEN_HASH
      token.value = this.chopIt()

      return token
    }

    if (this.src[this.cursor] === '"') {
      token.kind = TOKEN_STRING
      this.chopIt()

      while (this.cursor < this.src.length && this.src[this.cursor] !== '"' && this.src[this.cursor] !== "\n") {
        token.value += this.chopIt()
      }

      this.chopIt()

      return token;
    }

    if (isNumber(this.src[this.cursor])) {
      token.kind = TOKEN_NUMBER
      while (this.cursor < this.src.length && isNumber(this.src[this.cursor])) {
        token.value += this.chopIt()
      }

      return token;
    }

    if (isSymbolStart(this.src[this.cursor])) {
      token.kind = TOKEN_SYMBOL
      while (this.cursor < this.src.length && isSymbol(this.src[this.cursor])) {
        token.value += this.chopIt()
      }

      for (const keyword of KEYWORDS) {
        if (keyword === token.value) {
          token.kind = TOKEN_KEYWORD
          break
        }
      }

      return token
    }

    if (this.src[this.cursor] + this.src[this.cursor + 1] === "//") {
      token.kind = TOKEN_COMMENT
      while (this.cursor < this.src.length && this.src[this.cursor] != "\n") {
        token.value += this.chopIt()
      }
      return token
    }

    for (const t of LITERAL_TOKENS) {
      if (this.startsWith(t.value)) {
        token.kind = t.kind
        token.value = t.value
        this.cursor += t.value.length
        return token
      }
    }

    token.kind = TOKEN_INVALID
    token.value = this.chopIt()
    return token
  }

  trimLeft() {
    while (this.cursor < this.src.length && /\s/g.test(this.src[this.cursor])) {
      this.chopIt()
    }
  }

  startsWith(prefix) {
    if (!prefix) return true

    if (this.cursor + prefix.length - 1 > this.src.length) { // prefix exceeds src length 
      return false
    }

    for (let i = 0; i < prefix.length; ++i) {
      if (prefix[i] != this.src[this.cursor + i]) {
        return false
      }
    }

    return true
  }

  chopIt() {
    let ch = this.src[this.cursor]
    this.cursor += 1
    if (ch === "\n") {
      this.line += 1
      this.bol = this.cursor
    }

    return ch
  }
}


class Token {
  constructor({ kind, value = '' } = {}) {
    this.kind = kind
    this.value = value
  }
}

function isLetter(ch) {
  let code = ch.charCodeAt(0)
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
}

function isNumber(ch) {
  return /^\d$/.test(ch)
}

function isSymbolStart(ch) {
  return isLetter(ch) || ch === "#"
}

function isSymbol(ch) {
  return isLetter(ch) || isNumber(ch)
}

function parsePrimary(lexer) {
  const token = lexer.next()
  if (token.kind != TOKEN_END) {
    return token
  } else {
    throw new Error("Expected priamry expression, but reached the end of input")
  }
}

function parse(lexer) {
  const lhs = parsePrimary(lexer)
  const token = lexer.next();
  if (token.kind != TOKEN_END) {
    if (token.kind === TOKEN_PLUS || token.kind === TOKEN_DIVISION || token.kind === TOKEN_MINUS || token.kind === TOKEN_MULTIPLY) {
      const rhs = parse(lexer)
      return {
        op: token,
        lhs,
        rhs,
      }
    } else {
      console.error(token.kind)
    }
  }

  return lhs
}

function eval_expr(expr) {
  if (expr instanceof Token) {
    switch (expr.kind) {
      case TOKEN_NUMBER: {
        return Number(expr.value)
      }
      case TOKEN_SYMBOL: {
        switch (expr.value) {
          case "PI": return Math.PI
          default: throw new Error("Unknown variable")
        }
      }
    }
  } else if (typeof expr === "object") {
    switch (expr.op.kind) {
      case TOKEN_PLUS: {
        return eval_expr(expr.lhs) + eval_expr(expr.rhs)
      }
      case TOKEN_DIVISION: {
        return eval_expr(expr.lhs) / eval_expr(expr.rhs)
      }
      case TOKEN_MINUS: {
        return eval_expr(expr.lhs) - eval_expr(expr.rhs)
      }
      case TOKEN_MULTIPLY: {
        return eval_expr(expr.lhs) * eval_expr(expr.rhs)
      }
      default:
        throw new Error("Unreachable")
    }
  }
}

let code = `34*35`
let lexer = new Lexer({ src: code })
console.log(eval_expr(parse(lexer)));
// let token = lexer.next()

//while (token.kind != TOKEN_END) {
 // console.log(token)
  //token = lexer.next();
//}
