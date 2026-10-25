export default function TermsSections({ terms, compact = false }) {
  const partSize = compact ? 15 : 18;
  const headSize = compact ? 11 : 12.5;
  const bodySize = compact ? 12 : 14;

  return (
    <div>
      {terms.map((part, pi) => (
        <section key={part.part} style={{ marginBottom: compact ? 20 : 34 }}>
          <h2
            style={{
              fontSize: partSize,
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: '-0.3px',
              textTransform: 'uppercase',
              margin: pi === 0 ? '0 0 16px' : '10px 0 16px',
              paddingBottom: 8,
              borderBottom: '1px solid var(--border)',
            }}
          >
            {part.part}
          </h2>

          {part.blocks.map((b, bi) => {
            if (b.sub) {
              return (
                <div key={bi} style={{ marginBottom: 18 }}>
                  <h3 style={{ fontSize: headSize + 1.5, fontWeight: 800, color: 'var(--accent-text)', margin: '16px 0 8px', letterSpacing: 0.2 }}>
                    {b.sub}
                  </h3>
                  <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {b.list.map((item, ii) => (
                      <li key={ii} style={{ fontSize: bodySize, color: 'var(--muted)', lineHeight: 1.7, paddingLeft: 4 }}>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            }

            const paras = Array.isArray(b.p) ? b.p : [b.p];
            return (
              <div key={bi} style={{ marginBottom: 15 }}>
                {b.h && (
                  <p style={{ fontSize: headSize, fontWeight: 800, color: 'var(--accent-text)', letterSpacing: 0.5, margin: '0 0 5px', textTransform: 'uppercase' }}>
                    {b.h}
                  </p>
                )}
                {paras.map((para, pj) => (
                  <p key={pj} style={{ fontSize: bodySize, color: 'var(--muted)', lineHeight: 1.8, margin: pj === 0 ? 0 : '10px 0 0' }}>
                    {para}
                  </p>
                ))}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
