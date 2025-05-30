/**
 * 適切なファイル名となるよう、文字列を無害化する関数
 *
 * @param filename ファイル名
 * @returns {string} 無害化されたファイル名
 */
export function sanitizeFilename(filename){
  let result ="Untitled";

  if (filename) {
    // ファイル名としての禁則文字（\ / : * ? " < > |）と空白文字を無害化
    result = filename
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_');

    // もし処理の結果 文字列が空になった場合は、代替として 'Untitled' を使用
    if (result === '') result = 'Untitled';
  }
  return result;
}



/**
 * markdown 形式のファイルを生成し、保存する
 *
 * @param {string} markdownContent - 保存するMarkdownコンテンツ
 * @param {string} title - ファイル名に使用するタイトル
 * @returns {void}
 */
export function saveAsMarkdown(markdownContent, title) {
	// コンテンツの生成
	const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	// ダウンロード用リンクを作成
	const filename = `${ sanitizeFilename(title) || 'Untitled'}.md`;
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;

	// リンクを一時的にDOMに追加（Firefox用）し、イベント発火でダウンロードを開始
	document.body.appendChild(link);
	link.click();

	// 不要となったリンクを削除（オブジェクトの開放含む）
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}



/**
 * JSONデータをファイルとして保存する関数
 *
 * @param {string} jsonDataString - 保存するJSONデータの文字列
 * @param {string} baseFilename - ファイル名のベース部分 (例: "MDEja-MyDocument")
 */
export function saveJsonData(jsonDataString, baseFilename) {
  if (!jsonDataString) {
    console.error('保存するJSONデータがありません。');
    alert('保存するデータがありません。');
    return;
  }

  try {
    // ファイル名を決定（baseFilename に .json が含まれていなければ追加）
    const filename = baseFilename.endsWith('.json') ? baseFilename : `${baseFilename}.json`;

    const blob = new Blob([jsonDataString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('JSONデータの保存に失敗しました:', error);
    alert('JSONデータの保存に失敗しました。');
  }
}
