import React, { useState, useEffect, useCallback } from 'react';
import './GlobalMenu.css';

// sessionStorage キー
const SETTINGS_STORAGE_KEY = 'markdownEditorSettings';

// デフォルト設定（現状はカラーモードのみ）
const getDefaultSettings = () => ({
	colorMode: 0, // 0: default, 1: light, 2: dark
});

function GlobalMenu({ title, setTitle, blocks, onExport, onSave, onNew }) {
	const handleTitleChange = (event) => {
		setTitle(event.target.value);
	};

	const headings = blocks.filter(block => block.type === 'heading');

	// --- カラーモード状態管理 ---
	const [colorMode, setColorMode] = useState(() => {
		const savedSettings = sessionStorage.getItem(SETTINGS_STORAGE_KEY);
		if (savedSettings) {
			try {
				const parsed = JSON.parse(savedSettings);
				// 数値であることを確認（念のため）
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

	// ダイアログを開閉するための関数
	const openMenuDialog = useCallback(() => {
		const dialog = document.getElementById('global-menu');
		if (dialog) dialog.showModal();
	}, []);

	const closeMenuDialog = useCallback(() => {
		const dialog = document.getElementById('global-menu');
		if (dialog) dialog.close();
	}, []);

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
						<h3>操作</h3>
						<div className='menu-dialog-buttons'>
							{/* 各ボタンの onClick 時、本処理＋ダイアログを閉じる処理 */}
							<button onClick={() => { onNew(); closeMenuDialog(); }}>新規作成</button>
							<button onClick={() => { onExport(); closeMenuDialog(); }}>クリップボードにコピー</button>
							<button onClick={() => { onSave(); closeMenuDialog(); }}>ファイルとして保存</button>
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

					{/* 操作ボタン */}
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
