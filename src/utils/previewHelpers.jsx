/**
 * インラインMarkdown要素をReact要素に変換する関数
 * サポート:
 * - `**text**` -> `<strong>text</strong>`
 * - `*text*` -> `<em>text</em>`
 * - `[text](url)` -> `<a href="url">text</a>`
 * - `` `code` `` -> `<code>code</code>`
 * 
 * 注：ネストされたMarkdownの処理はサポートしません（例: `**[link](url)**` のテキスト部分の `*italic*` ）
 * 
 * @param {string} text - 処理するテキスト文字列
 * @returns {Array<React.ReactNode>} テキストノードとReact要素(strong, em, a, code)の配列
 */
export function processInlineMarkdown(text) {
  // 空でない場合はテキストノードとして配列で返し、空なら空配列
  if (typeof text !== 'string' || !text) {
    return text ? [text] : [];
  }

  const elements = [];
  let lastIndex = 0;

  // 正規表現の順番が重要: リンク -> インラインコード -> 太字 -> イタリック（ `.+?` は非貪欲マッチ）
  const regex = /\[(?<linkText>[^\]]+?)\]\((?<linkUrl>[^)]+?)\)|`(?<codeText>.+?)`|\*\*(?<boldText>.+?)\*\*|\*(?<italicText>.+?)\*/g;
  let match;
  let key = 0; // 各要素の一意なキーのためのカウンター

  while ((match = regex.exec(text)) !== null) {
    const startIndex = match.index;

    // マッチ開始位置までのプレーンテキスト部分を追加
    if (startIndex > lastIndex) {
      elements.push(text.substring(lastIndex, startIndex));
    }

    // match.groups が undefined にならないようにデフォルト値を設定
    const groups = match.groups || {};
    const { linkText, linkUrl, codeText, boldText, italicText } = groups;

    if (linkText !== undefined && linkUrl !== undefined) {
      // リンク要素
      elements.push(<a key={`inline-md-${key++}`} href={linkUrl} target="_blank" rel="noopener noreferrer">{linkText}</a>);
    } else if (codeText !== undefined) {
      // インラインコード要素
      elements.push(<code key={`inline-md-${key++}`}>{codeText}</code>);
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

  // 何も処理されなかった場合は元のテキストを配列で返す（空文字列の場合は空配列）
  // ※ elements 配列には文字列とJSX要素が混在、React はこれをそのまま子要素としてレンダリングできる。
  return elements.length > 0 ? elements : (text ? [text] : []);
}





/**
 * title, blocks から React 要素の配列と目次情報を生成してプレビュー用データを構築する関数
 * 
 * @param {string} title - ドキュメントのタイトル
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
      case 'paragraph': {
        // content が文字列かを判定、そうでない場合はフォールバック
        if (typeof block.content === 'string') {
          // 連続した2つ（以上）の改行で、別個の要素として取り扱う
          const paragraphsArray = block.content.split(/\n{2,}/);
          paragraphsArray.forEach((paraText, paraIndex) => {
            // 空の段落は生成しない（ブロック自体が空の段落だった場合は許容する）
            if (paraText.trim() || paragraphsArray.length === 1) {
              elements.push(
                <p key={`${blockKey}-${paraIndex}`}>
                  {processInlineMarkdown(paraText)}
                </p>
              );
            }
          });
        } else {
          elements.push(<p key={blockKey}>{processInlineMarkdown('【エラー】文字列でないため出力できませんでした')}</p>);
        }
        break;
      }
      case 'blockquote': {
        // paragraph とほぼ同じだが、`blockquote` 内に `p` を格納する関係上、若干挙動が異なる
        const quoteInnerElements = [];
        if (typeof block.content === 'string') {
          const quoteParagraphsArray = block.content.split(/\n{2,}/);
          quoteParagraphsArray.forEach((paraText, paraIndex) => {
            if (paraText.trim() || quoteParagraphsArray.length === 1) {
              quoteInnerElements.push(
                <p key={`${blockKey}-${paraIndex}`}>
                  {processInlineMarkdown(paraText)}
                </p>
              );
            }
          });
        } else {
          quoteInnerElements.push(<p key={`${blockKey}-empty`}>{processInlineMarkdown('【エラー】文字列でないため出力できませんでした')}</p>);
        }
        elements.push(
          <blockquote key={blockKey} id={blockId}>
            {/* 空のblockquoteでもpは一つあるようにする */}
            {quoteInnerElements.length > 0 ? quoteInnerElements : <p />}
          </blockquote>
        );
        break;
      }
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