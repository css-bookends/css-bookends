/* eslint-disable no-restricted-syntax -- this file IS the binder: it calls the codex
   bundle once and re-exports; that single bind is the whole point of the example. */
// The single binding module (the RECOMMENDED pattern). Call the codex bundle ONCE
// here with NO config (everything at its defaults), export the bound helpers, and
// import from THIS file everywhere else. Start simple; reach for config only when
// you need it, and even then set it here, not scattered inline.
import { createCalipersBundle } from '@css-bookends/css-calipers/codex';

export const { m, mPercent, r, i, f, color } = createCalipersBundle();
