import { ExternalTokenizer } from "@lezer/lr";
import * as terms from "./_parser.terms.js";

// UNICODE CODEPOINTS

const CHAR_DOT = ".".codePointAt(0);
const CHAR_BACKSLASH = "\\".codePointAt(0);
const CHAR_BACKQUOTE = "`".codePointAt(0);
const CHAR_DOLLAR = "$".codePointAt(0);
const CHAR_HASH = "#".codePointAt(0);
const CHAR_EQUAL = "=".codePointAt(0);
const CHAR_LPAREN = "(".codePointAt(0);
const CHAR_LBRACE = "{".codePointAt(0);
const CHAR_LBRACKET = "[".codePointAt(0);
const CHAR_SEMICOLON = ";".codePointAt(0);
const CHAR_COLON = ":".codePointAt(0);
const CHAR_DQUOTE = '"'.codePointAt(0);
const CHAR_NEWLINE = "\n".codePointAt(0);
const CHAR_A = "A".codePointAt(0);
const CHAR_Z = "Z".codePointAt(0);
const CHAR_a = "a".codePointAt(0);
const CHAR_z = "z".codePointAt(0);
const CHAR_0 = "0".codePointAt(0);
const CHAR_9 = "9".codePointAt(0);
const CHAR_UNDERSCORE = "_".codePointAt(0);
const CHAR_EXCLAMATION = "!".codePointAt(0);

// UNICODE CATEGORIES TESTS

const CAT_Lu = /^\p{Lu}/u;
const CAT_Ll = /^\p{Ll}/u;
const CAT_Lt = /^\p{Lt}/u;
const CAT_Lm = /^\p{Lm}/u;
const CAT_Lo = /^\p{Lo}/u;
const CAT_Me = /^\p{Me}/u;
const CAT_Mn = /^\p{Mn}/u;
const CAT_Mc = /^\p{Mc}/u;
const CAT_Nd = /^\p{Nd}/u;
const CAT_Nl = /^\p{Nl}/u;
const CAT_No = /^\p{No}/u;
const CAT_Pc = /^\p{Pc}/u;
const CAT_Sc = /^\p{Sc}/u;
const CAT_Sk = /^\p{Sk}/u;
const CAT_So = /^\p{So}/u;
const CAT_Emoji = /^\p{Emoji}/u;

// TERMINATOR

export const terminator = new ExternalTokenizer((input, stack) => {
  let c = input.peek(0);
  if (c === CHAR_NEWLINE || c === CHAR_SEMICOLON) {
    if (stack.canShift(terms.terminator)) {
      input.acceptToken(terms.terminator, 1);
      return;
    }
  }
});

// IDENTIFIER
// See https://github.com/JuliaLang/julia/blob/8218480f059b7d2ba3388646497b76759248dd86/src/flisp/julia_extensions.c#L67-L152

// prettier-ignore
function isIdentifierStartCharExtra(s, c) {
  return (
    CAT_Lu.test(s) || CAT_Ll.test(s) ||
    CAT_Lt.test(s) || CAT_Lm.test(s) ||
    CAT_Lo.test(s) || CAT_Nl.test(s) ||
    CAT_Sc.test(s) || // allow currency symbols
    CAT_Emoji.test(s) || // allow emoji
    // other symbols, but not arrows or replacement characters
    (CAT_So.test(s) &&
      !(c >= 0x2190 && c <= 0x21FF) &&
      c != 0xfffc && c != 0xfffd &&
      c != 0x233f &&  // notslash
      c != 0x00a6) || // broken bar

    // math symbol (category Sm) whitelist
    (c >= 0x2140 && c <= 0x2a1c &&
      ((c >= 0x2140 && c <= 0x2144) || // ⅀, ⅁, ⅂, ⅃, ⅄
      c == 0x223f || c == 0x22be || c == 0x22bf || // ∿, ⊾, ⊿
      c == 0x22a4 || c == 0x22a5 ||   // ⊤ ⊥

      (c >= 0x2202 && c <= 0x2233 &&
        (c == 0x2202 || c == 0x2205 || c == 0x2206 || // ∂, ∅, ∆
        c == 0x2207 || c == 0x220e || c == 0x220f || // ∇, ∎, ∏
        c == 0x2210 || c == 0x2211 || // ∐, ∑
        c == 0x221e || c == 0x221f || // ∞, ∟
        c >= 0x222b)) || // ∫, ∬, ∭, ∮, ∯, ∰, ∱, ∲, ∳

      (c >= 0x22c0 && c <= 0x22c3) ||  // N-ary big ops: ⋀, ⋁, ⋂, ⋃
      (c >= 0x25F8 && c <= 0x25ff) ||  // ◸, ◹, ◺, ◻, ◼, ◽, ◾, ◿

      (c >= 0x266f &&
        (c == 0x266f || c == 0x27d8 || c == 0x27d9 || // ♯, ⟘, ⟙
        (c >= 0x27c0 && c <= 0x27c1) ||  // ⟀, ⟁
        (c >= 0x29b0 && c <= 0x29b4) ||  // ⦰, ⦱, ⦲, ⦳, ⦴
        (c >= 0x2a00 && c <= 0x2a06) ||  // ⨀, ⨁, ⨂, ⨃, ⨄, ⨅, ⨆
        (c >= 0x2a09 && c <= 0x2a16) ||  // ⨉, ⨊, ⨋, ⨌, ⨍, ⨎, ⨏, ⨐, ⨑, ⨒, ⨓, ⨔, ⨕, ⨖
        c == 0x2a1b || c == 0x2a1c)))) || // ⨛, ⨜

    (c >= 0x1d6c1 && // variants of \nabla and \partial
      (c == 0x1d6c1 || c == 0x1d6db ||
      c == 0x1d6fb || c == 0x1d715 ||
      c == 0x1d735 || c == 0x1d74f ||
      c == 0x1d76f || c == 0x1d789 ||
      c == 0x1d7a9 || c == 0x1d7c3)) ||

    // super- and subscript +-=()
    (c >= 0x207a && c <= 0x207e) ||
    (c >= 0x208a && c <= 0x208e) ||

    // angle symbols
    (c >= 0x2220 && c <= 0x2222) || // ∠, ∡, ∢
    (c >= 0x299b && c <= 0x29af) || // ⦛, ⦜, ⦝, ⦞, ⦟, ⦠, ⦡, ⦢, ⦣, ⦤, ⦥, ⦦, ⦧, ⦨, ⦩, ⦪, ⦫, ⦬, ⦭, ⦮, ⦯

    // Other_ID_Start
    c == 0x2118 || c == 0x212E || // ℘, ℮
    (c >= 0x309B && c <= 0x309C) || // katakana-hiragana sound marks

    // bold-digits and double-struck digits
    (c >= 0x1D7CE && c <= 0x1D7E1) // 𝟎 through 𝟗 (inclusive), 𝟘 through 𝟡 (inclusive)
  ); 
}

function isIdentifierStartChar(input, offset) {
  let c = input.peek(offset);
  if (
    (c >= CHAR_A && c <= CHAR_Z) ||
    (c >= CHAR_a && c <= CHAR_z) ||
    c == CHAR_UNDERSCORE
  ) {
    return 1;
  } else if (c < 0xa1 || c > 0x10ffff) {
    return 0;
  } else {
    let s = combineSurrogates(input, offset);
    if (isIdentifierStartCharExtra(s, c)) {
      return s.length;
    } else {
      return 0;
    }
  }
}

/**
 * Return a string at current position by combining surrogate code points.
 */
function combineSurrogates(input, offset) {
  let eat = 1;
  let c = input.peek(offset);
  let s = String.fromCodePoint(c);
  while (true) {
    let nc = input.peek(offset + eat);
    // Break if c and nc are not surrogate pairs
    if (!(0xd800 <= c && c <= 0xdbff && 0xdc00 <= nc && nc <= 0xdfff)) {
      break;
    }
    s = s + String.fromCodePoint(nc);
    c = nc;
    eat = eat + 1;
  }
  return s;
}

export const Identifier = new ExternalTokenizer((input, stack) => {
  let start = true;
  let ok = true;
  let offset = 0;
  let eat = 1;
  while (true) {
    let c = input.peek(offset);
    if (c === -1) break;
    if (start) {
      start = false;
      eat = isIdentifierStartChar(input, offset);
      if (eat === 0) {
        break;
      }
    } else {
      if (
        (c >= CHAR_A && c <= CHAR_Z) ||
        (c >= CHAR_a && c <= CHAR_z) ||
        (c >= CHAR_0 && c <= CHAR_9) ||
        c == CHAR_UNDERSCORE ||
        c == CHAR_EXCLAMATION
      ) {
        // accept
      } else if (c < 0xa1 || c > 0x10ffff) {
        break;
      } else {
        let s = combineSurrogates(input, offset);
        eat = s.length;
        if (isIdentifierStartCharExtra(s, c)) {
          // accept
        } else if (
          CAT_Mn.test(s) ||
          CAT_Mc.test(s) ||
          CAT_Nd.test(s) ||
          CAT_Pc.test(s) ||
          CAT_Sk.test(s) ||
          CAT_Me.test(s) ||
          CAT_No.test(s) ||
          // primes (single, double, triple, their reverses, and quadruple)
          (c >= 0x2032 && c <= 0x2037) ||
          c == 0x2057
        ) {
          // accept
        } else {
          break;
        }
      }
    }
    offset = offset + eat;
    eat = 1;
  }
  if (offset !== 0) {
    input.acceptToken(terms.Identifier, offset);
  }
});

// STRING TOKENIZERS

const isStringInterpolation = (input, offset) => {
  let c = input.peek(offset);
  let nc = input.peek(offset + 1);
  return (
    c === CHAR_DOLLAR &&
    (isIdentifierStartChar(input, offset + 1) !== 0 || nc == CHAR_LPAREN)
  );
};

const makeStringContent = ({ till, term }) => {
  return new ExternalTokenizer((input, stack) => {
    let offset = 0;
    let eatNext = false;
    while (true) {
      let c = input.peek(offset);
      if (c === -1) break;
      if (c === CHAR_BACKSLASH) {
        eatNext = true;
      } else if (eatNext) {
        eatNext = false;
      } else if (isStringInterpolation(input, offset) || till(input, offset)) {
        if (offset > 0) {
          input.acceptToken(term, offset);
        }
        return;
      }
      offset = offset + 1;
    }
  });
};

const isTripleQuote = (input, offset) => {
  return (
    input.peek(offset) === CHAR_DQUOTE &&
    input.peek(offset + 1) === CHAR_DQUOTE &&
    input.peek(offset + 2) === CHAR_DQUOTE
  );
};

const isQuote = (input, offset) => {
  return input.peek(offset) === CHAR_DQUOTE;
};

const isBackquote = (input, offset) => {
  return input.peek(offset) === CHAR_BACKQUOTE;
};

export const tripleStringContent = makeStringContent({
  term: terms.tripleStringContent,
  till: isTripleQuote,
});
export const stringContent = makeStringContent({
  term: terms.stringContent,
  till: isQuote,
});
export const commandStringContent = makeStringContent({
  term: terms.commandStringContent,
  till: isBackquote,
});

// BLOCK COMMENT

const isBlockCommentStart = (input, offset) => {
  return (
    input.peek(offset) === CHAR_HASH && input.peek(offset + 1) === CHAR_EQUAL
  );
};

const isBlockCommentEnd = (input, offset) => {
  return (
    input.peek(offset) === CHAR_EQUAL && input.peek(offset + 1) === CHAR_HASH
  );
};

export const BlockComment = new ExternalTokenizer((input, stack) => {
  // BlockComment
  if (isBlockCommentStart(input, 0)) {
    let depth = 1;
    let cur = 2;
    while (input.peek(cur) !== -1) {
      if (isBlockCommentEnd(input, cur)) {
        depth = depth - 1;
        if (depth === 0) {
          input.acceptToken(terms.BlockComment, cur + 2);
          return;
        }
        cur = cur + 2;
      } else if (isBlockCommentStart(input, cur)) {
        depth = depth + 1;
        cur = cur + 2;
      } else {
        cur = cur + 1;
      }
    }
    input.acceptToken(terms.BlockComment, cur);
  }
});

// LAYOUT TOKENIZERS

const isWhitespace = (input, offset) => {
  let c = input.peek(offset);
  return (
    (c >= 9 && c < 14) ||
    (c >= 32 && c < 33) ||
    (c >= 133 && c < 134) ||
    (c >= 160 && c < 161) ||
    (c >= 5760 && c < 5761) ||
    (c >= 8192 && c < 8203) ||
    (c >= 8232 && c < 8234) ||
    (c >= 8239 && c < 8240) ||
    (c >= 8287 && c < 8288) ||
    (c >= 12288 && c < 12289)
  );
};

export const layoutExtra = new ExternalTokenizer(
  (input, stack) => {
    // immediateParen
    if (
      input.peek(0) === CHAR_LPAREN &&
      !isWhitespace(input, -1) &&
      stack.canShift(terms.immediateParen)
    ) {
      input.acceptToken(terms.immediateParen, 0);
      return;
    }
    // immediateColon
    if (
      input.peek(0) === CHAR_COLON &&
      !isWhitespace(input, -1) &&
      stack.canShift(terms.immediateColon)
    ) {
      input.acceptToken(terms.immediateColon, 0);
      return;
    }
    // immediateBrace
    if (
      input.peek(0) === CHAR_LBRACE &&
      !isWhitespace(input, -1) &&
      stack.canShift(terms.immediateBrace)
    ) {
      input.acceptToken(terms.immediateBrace, 0);
      return;
    }
    // immediateBracket
    if (
      input.peek(0) === CHAR_LBRACKET &&
      !isWhitespace(input, -1) &&
      stack.canShift(terms.immediateBracket)
    ) {
      input.acceptToken(terms.immediateBracket, 0);
      return;
    }
    // immediateDoubleQuote
    if (
      input.peek(0) === CHAR_DQUOTE &&
      !isWhitespace(input, -1) &&
      stack.canShift(terms.immediateDoubleQuote)
    ) {
      input.acceptToken(terms.immediateDoubleQuote, 0);
      return;
    }
    // immediateBackquote
    if (
      input.peek(0) === CHAR_BACKQUOTE &&
      !isWhitespace(input, -1) &&
      stack.canShift(terms.immediateBackquote)
    ) {
      input.acceptToken(terms.immediateBackquote, 0);
      return;
    }
    // immediateDot
    if (
      input.peek(0) === CHAR_DOT &&
      !isWhitespace(input, -1) &&
      stack.canShift(terms.immediateDot)
    ) {
      input.acceptToken(terms.immediateDot, 0);
      return;
    }
    // nowhitespace
    if (
      !isWhitespace(input, -1) &&
      !isWhitespace(input, 0) &&
      input.peek(0) !== -1 &&
      stack.canShift(terms.nowhitespace)
    ) {
      input.acceptToken(terms.nowhitespace, 0);
      return;
    }
  },
  {
    // This is needed so we enable GLR at positions those tokens might appear.
    extend: true,
  }
);
