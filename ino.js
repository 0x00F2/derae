const Lexer = require('lex')
const _ = require('lodash')

/*
*/

const test = `
posts
 aque
  title "Aque
  draft true
  o 1234
  tags
   code
   formats
  content <<aloe
   "& Aque is a collection of human-readable formats.
   "* Aloe
  content2
   HELLO
`

const aloe = {
  parse(string) {return 'aloe'},
  post(array) {return 'aloe'}
}

class Ino {
  constructor(addons) {
    this.addons = addons
    this.lexer = new Lexer(() => {})
    this.tokens = []
    this.lexer.addRule(/\d+(.?\d+)/, lexeme => {
      this.tokens.push({type: 'number', lexeme, content: eval(Number(lexeme))})
    })
    this.lexer.addRule(/true|false/, lexeme => {
      this.tokens.push({type: 'boolean', lexeme, content: eval(lexeme)})
      return 'BOOLEAN'
    })
    this.lexer.addRule(/[A-Za-z\-_0-9]+/, lexeme => {
      this.tokens.push({type: 'word', lexeme, content: lexeme})
      return 'WORD'
    })
    this.lexer.addRule(/<<[A-Za-z\-_0-9]*/, lexeme => {
      this.tokens.push({type: 'macro', lexeme, content: lexeme.replace(/<</g, "")})
      return 'WORD'
    })
    this.lexer.addRule(/\|"(.*)"\|/g, lexeme => {
      this.tokens.push({type: 'word', lexeme, content: lexeme.replace(/"/g, "").replace(/\|/g, "")})
      return 'WORD'
    })
    this.lexer.addRule(/#(\s+)?.*/, lexeme => {
      // this.tokens.push({type: 'comment', lexeme, content: lexeme.replace(/#(\s+)/, "")})
      return 'COMMENT'
    })
    this.lexer.addRule(/\n/, lexeme => {
      this.tokens.push({type: 'newline', lexeme, content: lexeme})
      return 'NEWLINE'
    })
    this.lexer.addRule(/".*"/, lexeme => {
      this.tokens.push({type: 'string', lexeme, content: lexeme.replace(/"/g, '')})
      return 'STRING'
    })
    this.lexer.addRule(/(("|').*)$/, lexeme => {
      this.tokens.push({type: 'string', lexeme, content: lexeme.replace(/"/g, '')})
      return 'STRING'
    })
    this.lexer.addRule(/^\s+/, lexeme => {
      this.tokens.push({type: 'indent', lexeme, content: lexeme.length})
      return 'INDENT'
    })
    this.lexer.addRule(/\s+/, lexeme => {})
  }

  parse(string) {
    let ind = [], _lin = [], lin = [], par
    let res = {__: []}, inarr = 0, currarr, oldarr, __arr, inmac=0, currmac, oldmac, __mac,currarrn, oldarrn,__arrn
    let lnl = string.trim().split("\n")
    for (let line of string.trim().split("\n")) {
      this.lexer.setInput(line)
      for (let i = 0; i<1000; i++) {
        this.lexer.lex()
      }

      let i = _.find(this.tokens, {type: 'indent'})
      if (i) { ind.push(i.content) } else { ind.push(0) }
      lin.push(this.tokens)

      this.tokens = []
    }

    // do actual parsing
    for (let idx in lin) {
      let line = lin[idx], indent = ind[idx]
      if (indent === 0) {
        //parent node
        console.log('prt ??', lnl[idx])
        oldarr = currarr
        par = currarr = res[line[0].content] = {}
        currarrn = line[0].content
      } else {
        if (indent != 0 && ind[Number(idx)+1] > indent) /* indent more */ {
          if (line.length === 3 && line[2].type === 'macro') {
            console.log('mac ??', lnl[idx])
            inmac++
            oldmac = currmac
            currmac = this.addons[line[2].content]
          }
          console.log('+i  ??', lnl[idx])
          oldarr = currarr
          oldarrn = currarrn
          currarrn = line[1].content
          currarr = oldarr[line[1].content] = []
        } else if (indent != 0 && ind[Number(idx)+1] < indent) /* indent less */ {
          if (line.length === 2 && line[1].type !== 'comment') {
            if (!inmac) {
              console.log('ae  ??', lnl[idx])
              currarr.push(line[1].content)
            } else if (!!inmac) {
              console.log('aem ??', lnl[idx])
              currarr.push(currmac.parse(line[1].content))
            }
          } else if (line.length === 2 && line[1].type === 'comment') {
            console.log('cmt ??', lnl[idx])
            res.__.push(line[1].content)
          } else if (line.length === 3 && line[2].type !== 'macro') {
            console.log('kp  ??', lnl[idx])
            currarr[_.camelCase(line[1].content)] = line[2].content
          }
          console.log('-i  ??', lnl[idx])
          if (inmac) {
            console.log('nmac??')
            if (currmac.post) { oldarr[currarrn] = currmac.post(currarr) }
            inmac--
            [oldmac, currmac] = [currmac, oldmac]
          }
          __arr = oldarr
          oldarr = currarr
          currarr = __arr
          __arrn = oldarrn
          oldarrn = currarrn
          currarrn = __arrn
        } else {
          if (line.length === 2 && line[1].type !== 'comment') {
            if (!inmac) {
              console.log('ae  ??', lnl[idx])
              currarr.push(line[1].content)
            } else if (!!inmac) {
              console.log('aem ??', lnl[idx])
              currarr.push(currmac.parse(line[1].content))
            }
          } else if (line.length === 2 && line[1].type === 'comment') {
            console.log('cmt ??', lnl[idx])
            res.__.push(line[1].content)
          } else if (line.length === 3 && line[2].type !== 'macro') {
            console.log('kp  ??', lnl[idx])
            currarr[_.camelCase(line[1].content)] = line[2].content
          }
        }
      }
    }
    console.log(res.posts)
  }
}

new Ino({ aloe }).parse(test)