/**
 * markdown 文を生成する
 *
 * @param {string} title - タイトル
 * @param {Array} blocks - ブロックの配列
 * @returns {string} - markdown 文として整形されたテキスト
 */
export function generateMarkdown(title, blocks) {

	// 出力にタイトルを h1 として追加
	let markdown = `# ${title || '無題'}\n\n`;

	// 各ブロックを該当する Markdown 形式に変換し、出力に追記
	blocks.forEach(block => {
		switch (block.type) {
			case 'heading':	// 見出し（空テキストはそのまま）
				markdown += `${'#'.repeat(block.level)} ${block.content || ''}\n\n`;
				break;
			case 'paragraph':	// 段落
				markdown += `${block.content}\n\n`;
				break;
			case 'blockquote':	// 引用（改行毎に `>` で始めるように）
				markdown += block.content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
				break;
			case 'orderedList':	// 番号付きリスト（中身が空でない場合に出力）
				if (block.items && block.items.length > 0) {
					block.items.forEach((item, index) => {
						markdown += `${index + 1}. ${item.content}\n`;
					});
					markdown += '\n';
				}
				break;
			case 'unorderedList':	// 箇条書きリスト（中身が空でない場合に出力）
				if (block.items && block.items.length > 0) {
					block.items.forEach(item => {
						markdown += `- ${item.content}\n`;
					});
					markdown += '\n';
				}
				break;
			case 'horizontalRule':	// 水平線
				markdown += '---\n\n';
				break;
			case 'code':	// コードブロック（言語指定があればそれを使用）
				markdown += `\`\`\`${block.language || ''}\n${block.content}\n\`\`\`\n\n`;
				break;
			default:	// 未知のブロックタイプは無視
				console.warn(`Unknown block type: ${block.type}`);
				break;
		}
	});

	// 末尾の余分な改行を削除して返す
	return markdown.replace(/\n\n$/, '\n');
}
