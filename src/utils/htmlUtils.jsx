/**
 * html のエスケープを行う
 * 
 * @param {string} unsafe - エスケープ対象の文字列
 * @returns {string} エスケープされた文字列
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
