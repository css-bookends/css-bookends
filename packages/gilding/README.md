# @css-bookends/gilding

The CSS-Bookends **finisher**: a build-time pass that wraps a CSS post-processor
(default: [Lightning CSS](https://lightningcss.dev/)) to complete browser
compatibility - older-browser color fallbacks and vendor prefixes - over the plain CSS
that books emit.

It is the output-edge construct, opposite the typesetter (typesetter: DTCG tokens in;
gilding: finished CSS out). Books and lexicons stay browser-agnostic and emit clean
modern CSS; gilding adds the compatibility trim, driven by your browser targets.

## What it is, and what it isn't

Gilding does not reimplement browser-compatibility handling. [Lightning
CSS](https://lightningcss.dev/) does the actual work: the fallbacks, the vendor
prefixing, the gamut gating. Gilding is the thin bookends layer around it, a stable
evergreen surface (your browser `targets`) and a swappable core, consistent with the
rest of CSS-Bookends, so the output edge of the typed pipeline is coherent and the
engine underneath can change without touching your setup. The value is the integration
and the seam, not the post-processing itself, and we name Lightning CSS plainly so that
is clear.

The only thing you configure is the evergreen part, your browser `targets`. The core
(default: the Lightning CSS adapter) is swappable behind that surface.

Status: early (0.x). The Lightning CSS core and the swappable seam are in place.
