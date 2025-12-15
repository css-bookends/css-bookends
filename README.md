# css-bookends

Composable, typed “bookends” around plain CSS.

> Status: early design / placeholder package. The concepts below describe the intended direction; the current npm package only exports a simple placeholder function.

## Concepts

CSS frameworks are usually class libraries with predefined styles. That’s not what this is. Conceptually, it is closer to backend rendering or compiler pipelines that validate inputs and generate HTML than to utility-first or class-based CSS frameworks. Validated, typed inputs go in. Plain CSS comes out.

Instead of authoring strings like "20px", values are represented as structured objects (css-calipers) and passed through domain helper APIs such as borders, margins, and padding. These helpers render plain CSS through a standard .css() call.

What happens in between, the “books” section, is intentionally left open. How you compose or layer those helpers is up to you.

CSS remains the final specification. This system does not replace it, restrict it, or redefine it. It enforces correctness at authoring time and emits fully inspectable CSS at build time.

## Installation

```bash
npm install @css-bookends/css-bookends
# or
pnpm add @css-bookends/css-bookends
```

## Usage (placeholder)

The current package only exports a minimal placeholder function:

```js
import { cssBookends } from "@css-bookends/css-bookends";

cssBookends(); // 'css-bookends placeholder package'
```

## Links

- css-bookends: https://github.com/slafleche/css-bookends · https://www.npmjs.com/package/@css-bookends/css-bookends
- css-calipers: https://github.com/slafleche/css-calipers · https://www.npmjs.com/org/css-calipers
