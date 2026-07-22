---
"@css-bookends/css-calipers": major
"@css-bookends/compendium": major
---

**Breaking:** the `hardening: 'warn' | 'fail'` reaction knob is retired. It is gone
from `i` / `f`, the `createInteger` / `createFloat` factories, the per-value options,
and the scalar-family / codex / compendium bundle `global` and per-unit keys. A value
bounded with `min` / `max` now ALWAYS throws when construction or arithmetic breaks the
bound, there is no reaction to configure.

As a consequence, a bounded builder ALWAYS brands its output `InRange<min, max>`
(previously the brand was dropped under `'warn'`).

Why: `warn` was dominated in every direction, catch-the-bug is `fail` (a throw with a
stack), don't-enforce is `u` (an unbounded value), and don't-crash-in-production is
served by clamping to a valid limit rather than shipping a broken value (which CSS
ignores anyway). With `fail` the only reaction left, the knob itself disappears.

Migration:

- Drop every `hardening` option (factory config, per-value `i` / `f` options, bundle
  `global` / unit keys). A bounded value throws on breach.
- If you set `hardening: 'warn'` to tolerate breaches, carry NO bound instead: use a
  plain number or the bare `u`. (A future `snap` config will let a bound absorb a
  breach to its limit; it is not in this release.)
