import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';

// ユーティリティ関数をインポート
import { escapeHtml } from '../utils/htmlUtils';
import { generatePreviewData } from '../utils/previewHelpers';
import { saveJsonData } from '../utils/fileSaver';

import './GlobalMenu.css';


// sessionStorage キー
const SETTINGS_STORAGE_KEY = 'markdownEditorSettings';
const LOCAL_STORAGE_KEY_GM = 'markdownEditorContent'; // saveJsonData 用（App.js と同じキー）

// デフォルト設定（現状はカラーモードのみ）
const getDefaultSettings = () => ({
	colorMode: 0, // 0: default, 1: light, 2: dark
});



function GlobalMenu({ title, setTitle, blocks, onExport, onSave, onNew, onLoadJsonData }) {

  // =====================================
  //   カラーモード関係の機能
  // =====================================

	// --- カラーモード状態管理 ---
	const [colorMode, setColorMode] = useState(() => {
		const savedSettings = sessionStorage.getItem(SETTINGS_STORAGE_KEY);
		if (savedSettings) {
			try {
				const parsed = JSON.parse(savedSettings);
				// 数値であることを確認し、カラーモードを設定
				const mode = parseInt(parsed.colorMode, 10);
				return !isNaN(mode) ? mode : getDefaultSettings().colorMode;
			} catch (e) {
				console.error("Failed to parse settings from sessionStorage", e);
				return getDefaultSettings().colorMode;
			}
		}
		return getDefaultSettings().colorMode;
	});

	// --- カラーモード変更時の処理 (クラス付与とsessionStorage保存) ---
	useEffect(() => {
		// bodyへのクラス付与とCSSによって、カラーモードを手動操作
		const applyColorModeClass = (mode) => {
			const rootElement = document.documentElement;
			rootElement.classList.remove("is_darkMode", "is_lightMode"); // 一旦両方削除
			switch (parseInt(mode, 10)) {
				case 1: // light
					rootElement.classList.add("is_lightMode");
					break;
				case 2: // dark
					rootElement.classList.add("is_darkMode");
					break;
				case 0: // default またはそれ以外
				default:
					// 何もクラスをつけない (OS設定等に依存させる場合など)
					break;
			}
		};

		// 現在の colorMode に基づいてクラスを適用
		applyColorModeClass(colorMode);

		// sessionStorage に現在の設定を保存
		try {
			const currentSettings = JSON.parse(sessionStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
			const newSettings = { ...getDefaultSettings(), ...currentSettings, colorMode: parseInt(colorMode, 10) };
			sessionStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
		} catch (e) {
			console.error("Failed to save settings to sessionStorage", e);

			// エラーが発生しても、最低限 colorMode だけは保存しようと試みる
			const fallbackSettings = { colorMode: parseInt(colorMode, 10) };
			sessionStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(fallbackSettings));
		}

	}, [colorMode]); // colorMode が変更されたときにこの effect を実行

	// select 要素の変更ハンドラ
	const handleColorModeChange = useCallback((event) => {
		setColorMode(parseInt(event.target.value, 10));
	}, []);





  // =====================================
  //   ダイアログの表示/非表示の機能
  // =====================================

  /** メニューダイアログの表示 */
	const openMenuDialog = useCallback(() => {
		const dialog = document.getElementById('global-menu');
		if (dialog) dialog.showModal();
	}, []);

  /** メニューダイアログを閉じる */
	const closeMenuDialog = useCallback(() => {
		const dialog = document.getElementById('global-menu');
		if (dialog) dialog.close();
	}, []);

  /** 見出しジャンプ用の heading 要素一覧 */
	const headings = blocks.filter(block => block.type === 'heading');

	const handleTitleChange = (event) => {
		setTitle(event.target.value);
	};











  // =====================================
  //   JSON 保存読込関係の機能
  // =====================================

  const fileInputRef = useRef(null); // JSONロード用のファイル入力
  
  // --- JSONデータからロード ---
  const handleLoadJsonButtonClick = () => {
      fileInputRef.current?.click(); // ファイル選択ダイアログを開く
  };

  /**
   * JSONデータを保存するハンドラ
   * @returns {void}
   */
  const handleSaveJson = useCallback(() => {
      const jsonDataString = localStorage.getItem(LOCAL_STORAGE_KEY_GM);
      if (jsonDataString) {
          try {
              const parsedData = JSON.parse(jsonDataString);
              const filenameTitle = parsedData.title ? parsedData.title.replace(/[^a-z0-9_-\s]/gi, '').replace(/\s+/g, '_') : 'Untitled';
              saveJsonData(jsonDataString, `MDEja-${filenameTitle}`);
          } catch (error) {
              console.error("localStorage のJSONデータのパースに失敗:", error);
              alert("データの保存準備に失敗しました。localStorageの内容が破損している可能性があります。");
          }
      } else {
          alert('保存するデータがlocalStorageに見つかりません。');
      }
      closeMenuDialog();
  }, [closeMenuDialog]); // titleに依存しない (localStorageから直接取得するため)


  /**
   * JSONデータをロードするハンドラ
   * @returns {void}
   */
  const handleFileSelectedForJsonLoad = useCallback((event) => {
      const file = event.target.files?.[0];
      if (!file) {
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          const fileContent = e.target.result;
          if (typeof fileContent === 'string') {
              onLoadJsonData(fileContent); // -> App.js の処理関数を呼び出す
          } else {
              alert('ファイル内容の読み取りに失敗しました。');
          }
      };
      reader.onerror = () => {
          console.error('ファイル読み込みエラー:', reader.error);
          alert('ファイルの読み込み中にエラーが発生しました。');
      };
      reader.readAsText(file);

      // 同じファイルを連続して選択できるように input の値をリセット
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
      closeMenuDialog(); // メニューを閉じる
  }, [onLoadJsonData, closeMenuDialog]);






  // =====================================
  //   プレビュー機能
  // =====================================

  /**
   * エディタ内容を新規ページとして出力するためのハンドラ
   * @returns {void}
   */
  const handleOpenPreviewInNewPage = useCallback(() => {

    const pageTitle = escapeHtml(title) || 'プレビュー';
    const { elements: contentReactElements, tocEntries } = generatePreviewData(pageTitle, blocks);

    // 目次HTMLの生成
    const navLinksHtml = tocEntries.map(entry =>
        `<li style="margin-left: ${Math.max(0, entry.level - 2) * 15}px;">
            <a href="#${entry.id}">${escapeHtml(entry.text)}</a>
          </li>`
    ).join('');
    const navHtml = `<ul>${navLinksHtml}</ul>`;

    // メインコンテンツHTMLの生成 (React要素からHTML文字列へ)
    const mainContentHtml = ReactDOMServer.renderToStaticMarkup(
        <React.Fragment>{contentReactElements}</React.Fragment>
    );

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    :root{font-family:"Noto Sans JP","Segoe UI","Hiragino Kaku Gothic ProN","BIZ UDPGothic",meiryo,sans-serif;line-height:1.5}*,::after,::before{box-sizing:border-box}
    body{margin:0;color:#1a1a1c;background-color:#f8f8fb}svg{fill:currentColor}button{appearance:none}a{color:#0024ce;text-decoration:underline;text-underline-offset:2px}a:active,a:visited,a:hover{color:#0000be}
    p{margin-bottom:1rem}ul,ol{padding-left:2rem;margin-top:1.5rem;margin-bottom:1.5rem}li{margin-bottom:.4rem}hr{border:0;border-top:2px solid #0000be;margin:2rem 0}
    pre{background-color:#f7f7f7;border:1px solid #ddd;padding:1rem;overflow-x:auto;font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace;font-size:.9rem;line-height:1.5;border-radius:3px}
    pre code{padding:0;background-color:transparent;border:none;font-size:inherit;color:inherit}code:not(pre>code){font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,Courier,monospace;background-color:#f0f0f0;padding:.2rem .4rem;border-radius:3px;font-size:.9rem}
    blockquote{border-left:4px solid #e0e0e0;padding:1rem 1.5rem;margin:1.5rem 0;background-color:#e8e8eb;color:#414143}blockquote p{margin:0 0 .5rem 0}blockquote p:last-child{margin-bottom:0}
    #header{background-color:#e8e8eb;border-bottom:1px solid #ccc}
    header{max-width:80ch;padding:8px 24px;margin-right:auto;margin-left:auto;display:flex;justify-content:space-between;align-items:center}
    header h2{margin:0;font-size:1.4rem}header button{padding:5px 10px;font-size:.9rem;cursor:pointer}
    nav{padding:15px;background-color:#f1f1f4;border-bottom:1px solid #eee}nav h3{margin-top:0;margin-bottom:10px;font-size:1.2rem}
    nav ul{list-style-type:none;padding-left:8px;margin:0}nav ul li{margin:1rem 0}
    main h1{margin-top:4rem;margin-bottom:1.5rem;font-size:2rem;font-weight:500;line-height:1.5;letter-spacing:.04em}
    main h2{margin-top:4rem;margin-bottom:1.5rem;font-size:1.75rem;font-weight:500;line-height:1.5;letter-spacing:.04em;border-bottom:1px solid #0000be}
    main h3{margin-top:2.5rem;margin-bottom:1.5rem;font-size:1.5rem;font-weight:500;line-height:1.5;letter-spacing:.04em;padding-left:10px;border-left:4px solid #0000be}
    main h4{margin-top:2.5rem;margin-bottom:1rem;font-size:1.25rem;font-weight:500;line-height:1.5;letter-spacing:.04em;position:relative;padding-left:10px;border-left:4px solid #0000be}
    main h4::before{position:absolute;top:0;left:1px;display:block;width:2px;height:100%;content:'';background-color:#0000be}
    main h5{margin-top:2.5rem;margin-bottom:1rem;font-size:1rem;font-weight:500;line-height:1.7;letter-spacing:.04em;position:relative;padding-left:10px}
    main h5::before{position:absolute;top:0;left:1px;display:block;width:4px;height:100%;content:'';border:1px solid #0000be;border-radius:2px}
    main h6{margin-top:1.5rem;margin-bottom:1rem;font-size:1rem;font-weight:400;line-height:1.7;letter-spacing:.04em}footer{margin:100px 0}
    #icon-button{display:flex;flex-grow:0;flex-shrink:0;flex-direction:column;gap:2px;align-items:center;justify-content:center;width:48px;height:48px;padding:0;margin:0;font-size:10px;color:#1a1a1c;text-decoration:none;cursor:pointer;background:none;border:none}
    #pageTop{position:fixed;right:24px;bottom:24px;z-index:10;display:flex;align-items:center;justify-content:center;width:56px;height:56px;color:#0028b5;cursor:pointer;background-color:#fff;border:1px solid #0028b5;border-radius:50%;transition:background-color 0.5s cubic-bezier(.4,.4,0,1);animation-name:fade_in;animation-duration:0.5s}
    #pageTop:hover{background-color:#e7eefd;border-color:#0f41af}#pageTop[hidden]{visibility:hidden;animation-name:fade_out;animation-duration:0.5s}
    *:focus{outline:2px solid #cd820a;outline-offset:2px;animation-name:focusEffect;animation-duration:0.3s}
    @keyframes fade_in{0%{visibility:hidden;opacity:0}1%{visibility:visible;opacity:.01}100%{visibility:visible;opacity:1}}
    @keyframes fade_out{0%{visibility:visible;opacity:1}99%{visibility:visible;opacity:.01}100%{visibility:hidden;opacity:0}}
    @keyframes focusEffect{from{outline-width:1px;outline-offset:8px}to{outline-width:2px;outline-offset:2px}}
    @media screen{#contents{max-width:80ch;padding:0 24px;margin-right:auto;margin-left:auto}}@media (min-width:960px){#pageTop{right:40px;bottom:40px}main h2{font-size:2rem;font-weight:400}main h3{font-size:1.75rem;font-weight:400}main h4{font-size:1.5rem;font-weight:400}main h5{font-size:1.25rem;font-weight:400;line-height:1.5}main h6{font-size:1rem;font-weight:500}}
    @media print{@page{margin:20mm 15mm}body{font-size:10pt;color:#000;background-color:#fff;orphans:3;widows:3}#header,footer{display:none!important}nav{background-color:#f1f1f4;border-bottom:1px solid #eee}main{padding:0}}
  </style>
</head>
<body>
  <div id="header">
    <header>
      <h2>プレビュー</h2>
      <button type="button" onclick="window.close()" id="icon-button">
        <svg role="graphics-symbol img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path strokeWidth="1.4286" d="M 22,4.0142857 19.985715,2 12,9.9857149 4.0142857,2 2,4.0142857 9.9857149,12 2,19.985715 4.0142857,22 12,14.014286 19.985715,22 22,19.985715 14.014286,12 Z"></path>
        </svg>
        閉じる
      </button>
    </header>
  </div>
  <div id="contents">
    <nav>
      <h3>目次</h3>
      ${navHtml}
    </nav>
    <main>
      ${mainContentHtml}
    </main>
  </div>
  <footer>
    <button type="button" id="pageTop" aria-label="ページトップに戻る">
      <svg role="graphics-symbol img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"></path>
      </svg>
    </button>
    <script>
      const pageTopFocusHeader = () =>
        document.getElementById("header").focus();
      const pageTopBtn = document.getElementById("pageTop");
      pageTopBtn.addEventListener("click", () => {
        window.scroll({ top: 0, behavior: "smooth" });
        setTimeout(pageTopFocusHeader, 1000);
      });
      let pageTopIsShow = true;
      function changeOpacity() {
        if (window.scrollY > 100) {
          if (pageTopIsShow == false) {
            pageTopBtn.hidden = false;
            pageTopIsShow = true;
          }
        } else {
          if (pageTopIsShow == true) {
            pageTopBtn.hidden = true;
            pageTopIsShow = false;
          }
        }
      }
      changeOpacity();
      window.addEventListener("scroll", () => changeOpacity());
    </script>
  </footer>
</body>
</html>
    `;

    // Blob を作成して新しいタブで開く
    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
        newWindow.focus();
    } else {
        alert('ポップアップブロックが有効になっている可能性があります。無効にしてから再度お試しください。');
    }
    closeMenuDialog();
  }, [title, blocks, closeMenuDialog]);



	return (
		<header className='header'>
			<h1>{title}</h1>
			<button
				type="button"
				className='icon-button'
				aria-controls="global-menu"
				onClick={openMenuDialog}
			>
				<svg role="graphics-symbol img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
					<path fillRule="evenodd" clipRule="evenodd" d="M21 5.5H3V7H21V5.5ZM21 11.2998H3V12.7998H21V11.2998ZM3 17H21V18.5H3V17Z"></path>
				</svg>
				メニュー
			</button>
			<dialog id='global-menu' className='menu-dialog'>
				<div className='menu-dialog-body'>
					<div className='menu-dialog-header'>
						<h2>メニュー</h2>
						<button
							type="button"
							className='icon-button'
							onClick={closeMenuDialog}
						>
							<svg role="graphics-symbol img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
								<path strokeWidth="1.4286" d="M 22,4.0142857 19.985715,2 12,9.9857149 4.0142857,2 2,4.0142857 9.9857149,12 2,19.985715 4.0142857,22 12,14.014286 19.985715,22 22,19.985715 14.014286,12 Z"></path>
							</svg>
							閉じる
						</button>
					</div>
					<div className='menu-dialog-content'>
						<h3>ドキュメント設定</h3>
						<div className='menu-dialog-input'>
							<label htmlFor="doc-title">文書タイトル</label>
							<input
								id="doc-title"
								type="text"
								value={title}
								onChange={handleTitleChange}
							/>
						</div>
						<div className='menu-dialog-input'>
							<label htmlFor="color-mode">
								カラーモード
							</label>
							{/* value と onChange を設定 */}
							<div className='color-mode-select'>
								<select
									name="color-mode"
									id="color-mode"
									value={colorMode}
									onChange={handleColorModeChange}
								>
									<option value={0}>デフォルト</option>
									<option value={1}>ライト</option>
									<option value={2}>ダーク</option>
								</select>
								<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 17.1L3 8L4 7L12 15L20 7L21 8L12 17.1Z"/>
								</svg>
							</div>
						</div>
					</div>

					{/* 操作ボタン */}
					<div className='menu-dialog-content'>
						<h3>操作ツール</h3>
						<div className='menu-dialog-content'>
              <fieldset className='menu-dialog-buttons'>
                <legend>操作</legend>
                <button onClick={() => { onNew(); closeMenuDialog(); }}>新規作成</button>
                <button onClick={handleOpenPreviewInNewPage}>プレビュー</button>
              </fieldset>
              <fieldset className='menu-dialog-buttons'>
                <legend>出力</legend>
                <button onClick={() => { onExport(); closeMenuDialog(); }}>クリップボードにコピー</button>
                <button onClick={() => { onSave(); closeMenuDialog(); }}>ファイルに書き出し（<code>md</code>）</button>
              </fieldset>
              <fieldset className='menu-dialog-buttons'>
                <legend>JSON</legend>
                <button onClick={handleSaveJson}>編集データを保存</button>
                <button onClick={handleLoadJsonButtonClick}>編集データを読込</button>
                <input
                  type="file"
                  accept=".json,application/json"
                  ref={fileInputRef}
                  onChange={handleFileSelectedForJsonLoad}
                  style={{ display: 'none' }}
                />
              </fieldset>
						</div>
					</div>

					{/* 見出しジャンプ */}
					{headings.length > 0 && (
						<nav className='menu-dialog-content' aria-labelledby='headings'>
							<h3 id='headings'>見出しジャンプ</h3>
							<ul className='menu-dialog-list'>
								{headings.map(heading => (
									<li
										key={heading.id}
										className={`menu-dialog-list-item menu-dialog-list-item--lv${heading.level}`}
									>
										<a
											className='link-text'
											href={`#block-${heading.id}`}
											onClick={closeMenuDialog} // スキップリンク処理
										>
											{heading.content || '（空の見出し）'} 【レベル{heading.level}】
										</a>
									</li>
								))}
							</ul>
						</nav>
					)}

					{/* アプリに関する説明 */}
					<div className='menu-dialog-content'>
						<h3>本アプリについて</h3>
						<p>
							このアプリは、日本語環境下で Markdown 文書を作成するための簡易的なエディタです。
							各種要素はブロック単位で管理されており、作成した文書は Markdown 形式で書き出すことができます。
						</p>
						<p>
							操作説明などの詳細は、
              <a className='link-text' href='https://github.com/nonaka101/markdown-editor-ja'>
                GitHub リポジトリ
              </a>
              をご覧ください。
						</p>
					</div>
				</div>
			</dialog>
		</header>
	);
}

export default GlobalMenu;
