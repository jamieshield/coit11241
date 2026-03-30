// 1) Strictly avoid unsupported features (e.g., f-strings)
  // Optional: rewrite f-strings to .format() before running
  function rewriteFStrings(py) {
    // Very simple pass: f"Hello {name}" -> "Hello {}".format(name)
    // Handles: f"...{expr}..." with multiple expressions; does not handle nested braces.
    // Enough for teaching use; avoids crashing Skulpt on f-strings.
    return py.replace(/f"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m, inner) => {
      const parts = [];      // literal chunks between {...}
      const exprs = [];      // expressions inside {}
      let buf = "";
      let i = 0, depth = 0, inExpr = false;

      function flushLiteral() { parts.push(buf); buf = ""; }

      while (i < inner.length) {
        const ch = inner[i];

        if (!inExpr && ch === '{') {
          // Start expression
          flushLiteral();
          depth = 1; inExpr = true;
          i++;
          let e = "";
          while (i < inner.length && depth > 0) {
            const c = inner[i];
            if (c === '{') { depth++; e += c; }
            else if (c === '}') { depth--; if (depth>0) e += c; }
            else { e += c; }
            i++;
          }
          exprs.push(e.trim());
          continue;
        }

        if (!inExpr && ch === '\\') {
          // keep escapes
          buf += ch;
          if (i + 1 < inner.length) { buf += inner[i+1]; i += 2; continue; }
        }

        buf += ch;
        i++;
      }
      flushLiteral();

      // Build "lit0{}lit1{}...".format(expr0, expr1, ...)
      const fmt = parts.map((p, idx) => {
        // unescape any doubled braces
        const lit = p.replace(/{{/g, '{').replace(/}}/g, '}');
        return idx < parts.length - 1 ? lit + '{}' : lit;
      }).join('');
      const call = exprs.length ? `.format(${exprs.join(', ')})` : '';
      console.log("rewrite fstrings")
      console.log(fmt)
      console.log(call)
      return `"${fmt}"${call}`;
    });
  }