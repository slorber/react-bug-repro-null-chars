# react-bug-repro-null-chars

React 18.3.1 `renderToPipeableStream` sometimes emit NULL chars bug while `renderToString` doesn't.

Run with `node repro.js`

See:
- https://github.com/facebook/docusaurus/issues/9985#issuecomment-2396367797
- https://x.com/sebastienlorber/status/1842252053390709058
