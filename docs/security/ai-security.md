# AI Security

SwingVantage uses AI for swing analysis and coaching, so AI is a first-class
security domain. This maps to the **OWASP Top 10 for LLM Applications**.

## Controls in place

- **Keyless-first:** every AI feature has a local, keyless mode. With no paid
  provider configured there is no live AI spend or external call.
- **Spend kill-switch:** `AI_DAILY_BUDGET_CENTS` caps total daily AI spend
  across all paid routes. Arm it whenever a paid provider is set.
- **Rate limiting:** public + AI endpoints are throttled (distributed limiter
  in production) to prevent abuse and cost spikes.

## Risks tracked (LLM Top 10)

| Risk | What we do / should do |
| --- | --- |
| LLM01 Prompt injection | Treat user input as untrusted. **Gap:** add a stored red-team prompt suite (system-prompt leakage, role bypass, data exfiltration, unsafe advice). |
| LLM02 Insecure output handling | Validate model output before it drives actions; never render it as trusted HTML. |
| LLM04 Model DoS / unbounded consumption | AI budget kill-switch + rate limiting. |
| LLM06 Sensitive information disclosure | Don't send unnecessary PII to the model; redact logs. |
| LLM07 Insecure plugin/tool design | Keep AI tool/action permissions least-privilege and bounded. |
| LLM08 Excessive agency | AI recommends; it does not take irreversible actions on a user's behalf. |

## Prompt-injection test suite (Phase 2)

A non-destructive, stored, runnable suite covering attempts to:

- reveal the system prompt,
- bypass role restrictions,
- exfiltrate other users' data,
- make admin-only changes,
- override policy constraints,
- manipulate coaching/analysis output,
- force unsafe recommendations.

Results feed securityOS findings. Until it exists, securityOS surfaces this as
an open AI-security finding (honest by design).

## Ethics

AI only uses data it is permitted to use. We never train on or sell user data.
AI coaching is performance guidance, never medical or psychological advice.
