/** Quote a CSV cell and neutralize spreadsheet formulas, including whitespace prefixes. */
export function csvCell(value: unknown): string {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const negativeNumber = /^-\d+(?:\.\d+)?$/.test(text);
  if ((!negativeNumber && /^[\s\u0000-\u001f]*[=+@-]/.test(text)) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}