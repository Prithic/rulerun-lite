import { useState, type Dispatch, type SetStateAction } from 'react';
import { Check, ChevronDown, Mic, Sparkles, X } from 'lucide-react';
import { initialRules, labels, conditions, type Rule } from '../lib/rules';
import { suggestRulesFromNotes, type RuleSuggestionResult } from '../lib/rule-suggester';

export function RuleEditor({
  spec,
  setSpec,
  rules,
  setRules,
  dictate,
  listening,
  onNotify,
}: {
  spec: string;
  setSpec: (s: string) => void;
  rules: Rule[];
  setRules: Dispatch<SetStateAction<Rule[]>>;
  dictate: () => void;
  listening: boolean;
  onNotify?: (message: string) => void;
}) {
  const [suggestion, setSuggestion] = useState<RuleSuggestionResult | null>(null);

  const handleSuggest = () => {
    const res = suggestRulesFromNotes(spec);
    setSuggestion(res);
  };

  const applySuggestions = () => {
    if (!suggestion || suggestion.recognized.length === 0) return;
    setRules(suggestion.suggestedRules);
    setSuggestion(null);
    onNotify?.(`Applied ${suggestion.recognized.length} suggested ${suggestion.recognized.length === 1 ? 'rule' : 'rules'} from your notes. Rerun checks to update results.`);
  };

  return (
    <section className="rules-pane">
      <div className="panel-heading">
        <h2>
          <span className="section-number">02</span>Define the behavior
        </h2>
        <span className="manual-label">No AI required</span>
      </div>

      <div className="requirements-label">
        <label htmlFor="requirements">Your requirements</label>
        <button className="text-button" onClick={dictate} aria-pressed={listening}>
          <Mic size={14} />
          {listening ? 'Stop dictation' : 'Dictate'}
        </button>
      </div>

      <textarea
        id="requirements"
        className="requirements"
        value={spec}
        onChange={(e) => setSpec(e.target.value)}
        maxLength={2000}
      />

      <div className="requirements-actions">
        <button
          type="button"
          className="suggest-button"
          onClick={handleSuggest}
          aria-expanded={suggestion !== null}
        >
          <Sparkles size={13} />
          Suggest rules from notes
        </button>
      </div>

      {suggestion && (
        <div className="suggestion-review" role="region" aria-label="Suggested rules review">
          <div className="suggestion-header">
            <strong>Reviewed rule suggestions</strong>
            <button
              className="text-button"
              type="button"
              onClick={() => setSuggestion(null)}
              aria-label="Close suggestions"
            >
              <X size={14} />
            </button>
          </div>

          {suggestion.recognized.length > 0 ? (
            <div className="suggestion-recognized">
              <span className="suggestion-subheading">
                Recognized {suggestion.recognized.length} supported property {suggestion.recognized.length === 1 ? 'rule' : 'rules'}:
              </span>
              <ul>
                {suggestion.recognized.map((r) => (
                  <li key={r.kind}>
                    <Check size={14} className="green" />
                    <span>
                      <strong>{r.label}</strong>
                      <small className="matched-phrase"> &mdash; matched &ldquo;{r.matchedPhrase}&rdquo;</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="suggestion-empty">No supported properties were recognized in your notes.</p>
          )}

          {suggestion.unmapped.length > 0 && (
            <div className="suggestion-unmapped">
              <span className="suggestion-subheading">
                Unrecognized notes ({suggestion.unmapped.length}) &mdash; not mapped to the 4 supported templates and will not be tested:
              </span>
              <ul>
                {suggestion.unmapped.map((u, i) => (
                  <li key={i}>
                    <code>{u}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="suggestion-actions">
            <button
              type="button"
              className="primary-small"
              onClick={applySuggestions}
              disabled={suggestion.recognized.length === 0}
            >
              Apply suggested rules
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setSuggestion(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p className="helper">Type or dictate notes. Use suggestions or choose executable properties manually below.</p>

      <div className="rules-heading">
        <span>EXECUTABLE RULES</span>
        <span>{rules.filter((r) => r.enabled).length} enabled</span>
      </div>

      <div className="rule-list">
        {rules.map((rule, i) => (
          <div className={'rule ' + (!rule.enabled ? 'rule-disabled' : '')} key={i}>
            <input
              type="checkbox"
              aria-label={`Enable rule ${i + 1}`}
              checked={rule.enabled}
              onChange={(e) =>
                setRules((r) =>
                  r.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x))
                )
              }
            />
            <div className="rule-content">
              <select
                aria-label={`Property for rule ${i + 1}`}
                value={rule.kind}
                onChange={(e) =>
                  setRules((r) =>
                    r.map((x, j) =>
                      i === j ? { ...x, kind: e.target.value as Rule['kind'] } : x
                    )
                  )
                }
              >
                {initialRules.map((x) => (
                  <option key={x.kind} value={x.kind}>
                    {labels[x.kind]}
                  </option>
                ))}
              </select>
              <code>{conditions[rule.kind]}</code>
            </div>
            <ChevronDown size={13} />
          </div>
        ))}
      </div>
    </section>
  );
}
