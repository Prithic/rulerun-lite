import { type Rule, kinds, labels } from './rules';

export interface RecognizedProperty {
  kind: Rule['kind'];
  label: string;
  matchedPhrase: string;
  sourceClause: string;
}

export interface RuleSuggestionResult {
  recognized: RecognizedProperty[];
  unmapped: string[];
  suggestedRules: Rule[];
}

// Explicit phrase patterns for each of the 4 supported properties.
const phraseRules: { kind: Rule['kind']; patterns: RegExp[] }[] = [
  {
    kind: 'nonNegative',
    patterns: [
      /\b(?:never|not|cannot|must\s+not|can't)\s+(?:be\s+)?negative\b/i,
      /\b(?:non-negative|non\s+negative|no\s+negative)\b/i,
      /\bat\s+least\s+zero\b/i,
      /\bgreater\s+than\s+or\s+equal\s+to\s+zero\b/i,
      />=\s*0\b/i,
      /\bresult\s+is\s+never\s+negative\b/i,
      /\bmust\s+never\s+be\s+negative\b/i,
      /\bnever\s+negative\b/i,
    ],
  },
  {
    kind: 'zeroIdentity',
    patterns: [
      /\b(?:0%|0\s+percent|zero\s+percent|zero\s*%)\s+(?:discount\s+)?(?:preserves|keeps|returns|leaves)\s+(?:the\s+)?(?:original\s+)?price\b/i,
      /\b(?:preserves|keeps|returns)\s+(?:the\s+)?(?:original\s+)?price\s+(?:when|for|with|if)\s+(?:0%|0\s+percent|zero\s+percent|no\s+discount)\b/i,
      /\b(?:0%|0\s+percent|zero\s+percent)\s+(?:discount\s+)?(?:has\s+no\s+effect|leaves\s+price\s+unchanged|does\s+not\s+change\s+the\s+price)\b/i,
      /\bno\s+discount\s+(?:preserves|keeps|returns)\s+(?:the\s+)?(?:original\s+)?price\b/i,
      /\ba\s+0%\s+discount\s+preserves\s+the\s+price\b/i,
      /\b0%\s+discount\s+preserves\s+the\s+price\b/i,
      /\b0%\s+discount\s+keeps\s+the\s+original\s+price\b/i,
      /\bzero\s+percent\s+returns\s+the\s+original\s+price\b/i,
    ],
  },
  {
    kind: 'fullDiscount',
    patterns: [
      /\b(?:100%|100\s+percent|hundred\s+percent|full\s+discount)\s+(?:discount\s+)?(?:produces|gives|returns|results\s+in|makes\s+it)\s+(?:a\s+price\s+of\s+)?(?:zero|0|free)\b/i,
      /\b(?:free|zero|0)\s+(?:when|if|for)\s+(?:100%|100\s+percent|full\s+discount)\b/i,
      /\ba\s+100%\s+discount\s+produces\s+zero\b/i,
      /\b100%\s+discount\s+produces\s+zero\b/i,
      /\b100%\s+discount\s+gives\s+a\s+price\s+of\s+zero\b/i,
      /\bmakes\s+it\s+free\s+at\s+100%\b/i,
      /\b100%\s+discount\s+makes\s+it\s+free\b/i,
    ],
  },
  {
    kind: 'upperBound',
    patterns: [
      /\b(?:never|not|cannot|must\s+not|can't)\s+exceed\s+(?:the\s+)?(?:original\s+)?price\b/i,
      /\bexceed\s+(?:the\s+)?(?:original\s+)?price\b/i,
      /\bresult\s+never\s+exceeds\s+(?:the\s+)?price\b/i,
      /\b(?:never|not)\s+(?:greater|higher|more)\s+than\s+(?:the\s+)?(?:original\s+)?price\b/i,
      /\bat\s+most\s+(?:the\s+)?(?:original\s+)?price\b/i,
      /\bless\s+than\s+or\s+equal\s+to\s+(?:the\s+)?price\b/i,
      /\bcapped\s+at\s+(?:the\s+)?(?:original\s+)?price\b/i,
      /\bno\s+more\s+than\s+(?:the\s+)?price\b/i,
    ],
  },
];

export function suggestRulesFromNotes(text: string): RuleSuggestionResult {
  if (!text || !text.trim()) {
    return {
      recognized: [],
      unmapped: [],
      suggestedRules: kinds.map((kind) => ({ kind, enabled: true })),
    };
  }

  // Split text into clauses by sentence-terminators or clause-separators (period, newline, semicolon, exclamation, comma, 'and', 'or')
  const rawClauses = text
    .split(/(?:[.\n;!]+|\b(?:and|or)\b)/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const recognized: RecognizedProperty[] = [];
  const recognizedKinds = new Set<Rule['kind']>();
  const unmapped: string[] = [];

  for (const clause of rawClauses) {
    let matched = false;
    for (const rule of phraseRules) {
      if (recognizedKinds.has(rule.kind)) continue;
      for (const pattern of rule.patterns) {
        const match = clause.match(pattern);
        if (match) {
          recognizedKinds.add(rule.kind);
          recognized.push({
            kind: rule.kind,
            label: labels[rule.kind],
            matchedPhrase: match[0],
            sourceClause: clause,
          });
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    // If clause was not matched and has substantive content (> 3 chars and not purely punctuation/numbers)
    if (!matched && /[a-zA-Z]{3,}/.test(clause)) {
      // Check if this clause was part of another match or already covered
      const alreadyCovered = recognized.some((r) => r.sourceClause.includes(clause) || clause.includes(r.matchedPhrase));
      if (!alreadyCovered) {
        unmapped.push(clause);
      }
    }
  }

  // Build the suggested rules list: keep all 4 kinds in order, enable recognized ones
  const suggestedRules: Rule[] = kinds.map((kind) => ({
    kind,
    enabled: recognizedKinds.size > 0 ? recognizedKinds.has(kind) : true,
  }));

  return {
    recognized,
    unmapped,
    suggestedRules,
  };
}
