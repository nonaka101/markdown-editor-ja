/**
 * インラインMarkdown要素をReact要素に変換する関数
 * サポート:
 * - `**` -> `strong` タグ
 * - `*` -> `em` タグ
 * - `[text](url)` -> `<a href="url">text</a>`
 * 
 * 注：ネストされたMarkdownの処理はサポートしません（例: `**[link](url)**` のテキスト部分の `*italic*` ）
 * 
 * @param {string} text - 処理するテキスト文字列
 * @returns {Array<React.ReactNode>} テキストノードとReact要素(strong, em, a)の配列
 */
export function processInlineMarkdown(text) {
  // 空でない場合はテキストノードとして配列で返し、空なら空配列
  if (typeof text !== 'string' || !text) {
    return text ? [text] : [];
  }

  const elements = [];
  let lastIndex = 0;

  // 正規表現の順番が重要: リンク -> 太字 -> イタリック（ `.+?` は非貪欲マッチ）
  const regex = /\[(?<linkText>[^\]]+?)\]\((?<linkUrl>[^)]+?)\)|\*\*(?<boldText>.+?)\*\*|\*(?<italicText>.+?)\*/g;
  let match;
  let key = 0; // 各要素の一意なキーのためのカウンター

  while ((match = regex.exec(text)) !== null) {
    const startIndex = match.index;

    // マッチ開始位置までのプレーンテキスト部分を追加
    if (startIndex > lastIndex) {
      elements.push(text.substring(lastIndex, startIndex));
    }

    const { linkText, linkUrl, boldText, italicText } = match.groups;

    if (linkText !== undefined && linkUrl !== undefined) {
      // リンク要素
      elements.push(<a key={`inline-md-${key++}`} href={linkUrl} target="_blank" rel="noopener noreferrer">{linkText}</a>);
    } else if (boldText !== undefined) {
      // 太字要素
      elements.push(<strong key={`inline-md-${key++}`}>{boldText}</strong>);
    } else if (italicText !== undefined) {
      // イタリック要素
      elements.push(<em key={`inline-md-${key++}`}>{italicText}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  // 最後のマッチ以降の残りのプレーンテキスト部分を追加
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  // elements 配列には文字列とJSX要素が混在、React はこれをそのまま子要素としてレンダリングできる。
  return elements.length > 0 ? elements : [text]; // 何も処理されなかった場合は元のテキストを配列で返す
}





/**
 * title, blocks から React 要素の配列と目次情報を生成してプレビュー用データを構築する関数
 * (processInlineMarkdown を使用するように更新)
 * 
 * @param {Array<Object>} blocks - ブロックデータの配列
 * @param {string} [keyPrefix='preview-'] - React 要素のキーのプレフィックス
 * @returns {{elements: Array<React.ReactNode>, tocEntries: Array<{id: string, text: string, level: number}>}}
 */
export function generatePreviewData(title, blocks, keyPrefix = 'preview-') {
  const elements = [];
  const tocEntries = [];

  // タイトル要素（ h1 ）
  elements.push(<h1 key={`${keyPrefix}doc-title`} id={`${keyPrefix}doc-title`}>{processInlineMarkdown(title)}</h1>);
  tocEntries.push({ id: `${keyPrefix}doc-title`, text: title, level: 1 });


  blocks.forEach((block, index) => {
    const blockKey = `${keyPrefix}block-${block.id || index}`;
    const blockId = `preview-block-${block.id || index}`; // ページ内リンク用のID

    switch (block.type) {
      case 'heading': { 
        const HeadingTag = `h${block.level}`;
        const headingText = block.content || '(見出しなし)';
        // 見出しテキスト
        elements.push(<HeadingTag key={blockKey} id={blockId}>{processInlineMarkdown(headingText)}</HeadingTag>);
        // ※目次用のテキストには インラインMarkdown 処理は適用せず、プレーンなテキストを使用
        tocEntries.push({ id: blockId, text: headingText, level: block.level });
        break; }
      case 'paragraph':
        // 段落テキスト
        elements.push(<p key={blockKey}>{processInlineMarkdown(block.content)}</p>);
        break;
      case 'blockquote':
        // 引用内テキスト
        elements.push(
          <blockquote key={blockKey} id={blockId}>
            <p>{processInlineMarkdown(block.content)}</p>
          </blockquote>
        );
        break;
      case 'orderedList':
      case 'unorderedList':{
        const ListTag = block.type === 'orderedList' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={blockKey}>
            {block.items && block.items.map((item, itemIndex) => (
              // リスト項目
              <li key={`${blockKey}-item-${item.id || itemIndex}`}>{processInlineMarkdown(item.content)}</li>
            ))}
          </ListTag>
        );
        break; }
      case 'horizontalRule':
        elements.push(<hr key={blockKey} />);
        break;
      case 'code': // コードブロック内は、インラインMarkdown処理の対象外
        elements.push(
          <pre key={blockKey} id={blockId}>
            <code className={block.language ? `language-${block.language}` : ''}>
              {block.content}
            </code>
          </pre>
        );
        break;
      default:
        elements.push(<p key={`${blockKey}-unknown`}>Unsupported block type: {block.type}</p>);
        break;
    }
  });
  return { elements, tocEntries };
}