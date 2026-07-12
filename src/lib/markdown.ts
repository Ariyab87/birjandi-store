// Minimal markdown → HTML for article content authored by us in Strapi.
// Supports: ## / ### headings, paragraphs, **bold**, [links](url), - lists.
// Content is admin-authored only, never user input.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, href) => {
      const safe = /^(https?:\/\/|\/)/.test(href) ? href : '#';
      const ext = safe.startsWith('http') && !safe.includes('kalaland24.com');
      return `<a href="${safe}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    });
}

export function markdownToHtml(md: string): string {
  const blocks = md.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const html = blocks.map(block => {
    const b = block.trim();
    if (!b) return '';
    if (b.startsWith('### ')) return `<h3>${inline(escapeHtml(b.slice(4)))}</h3>`;
    if (b.startsWith('## ')) return `<h2>${inline(escapeHtml(b.slice(3)))}</h2>`;
    if (b.split('\n').every(l => l.trim().startsWith('- '))) {
      const items = b.split('\n').map(l => `<li>${inline(escapeHtml(l.trim().slice(2)))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${inline(escapeHtml(b)).replace(/\n/g, '<br/>')}</p>`;
  });
  return html.join('\n');
}
