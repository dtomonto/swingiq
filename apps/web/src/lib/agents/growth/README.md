# Growth Agents

## In Plain English (start here)

This folder is the **growth brain** of SwingVantage. It contains seven small,
honest "agents" that each watch your own data and decide one helpful thing —
plus a coordinator that runs them together and picks the single best thing to
show you at any moment.

Everything here is **deterministic** (plain rules over your real data, $0 to
run, no AI key needed). An AI model is only ever an optional layer that
re-words copy — it can never invent a number or a claim.

## The seven agents

| Agent | Folder | What it decides |
|-------|--------|-----------------|
| Churn-Risk | `../churn` | How likely you are to drift away (0–100, with reasons) |
| Re-Engagement Dispatch | `../dispatch` | When/how/what to send to win you back (draft-first) |
| Activation Concierge | `../activation` | The exact next step to your first "aha" |
| Earn-Moment Referral | `../earn-moments` | When you just had a win worth sharing |
| Live Practice Companion | `../practice-companion` | How to coach you rep-by-rep in a session |
| Trust / Honesty Linter | `../trust-linter` | Whether any copy overclaims or misleads |
| Ad-Creative | `../ad-creative` | Honest, proof-grounded paid-ad variants |

## The coordinator

`runGrowthAgents(ctx, inputs)` runs churn + activation + dispatch + referral and
returns one **primary surface** to show, by priority:

1. **Not activated yet** → show the activation nudge (get to the first result).
2. **Activated but slipping** → show a re-engagement message.
3. **Just had a real win** → ask for a referral at peak emotion.
4. **Otherwise** → stay quiet.

In React, use the `useGrowthAgents()` hook — it wires this to the store and
auto-derives churn sentiment from your Daily Notes.

## How this relates to `lib/reengage`

Another module, **`@/lib/reengage`**, is the production **outbound delivery**
system (in-app / push / email, with channel prefs, frequency caps, quiet hours,
an admin screen, and warm trigger copy). It fires on **binary thresholds**
("14 days since last activity") and has no sense of *how* at-risk someone is.

Rather than duplicate it, **`reengageBridge.ts`** wires the two together
(read-only — it never edits reengage):

- `selectChurnAwareNudge(...)` runs reengage's selection **and** our Churn
  score. It can *gate* a low-value comeback nudge when our richer model says
  you're actually fine (`suppressIfSafe`), and always returns the score so the
  caller can escalate the channel or log risk on send.
- `toActivitySignal(ctx)` builds reengage's signal from our normalized context,
  so a server/cron path can drive reengage from the same source of truth.

**Recommended division of labor:** reengage owns *delivery + caps + UI*; our
Churn agent is its *prioritization brain*; our Activation agent is the richer
*funnel model*. The standalone Dispatch agent (`../dispatch`) remains useful for
contexts that want a fully self-contained decision+copy without reengage.
