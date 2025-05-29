// eslint-disable-next-line no-unused-vars
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import GlobalMenu from './components/GlobalMenu';
import Editor from './components/Editor';
import { generateMarkdown } from './utils/markdownGenerator';
import { saveAsMarkdown } from './utils/fileSaver';
import './App.css';

const LOCAL_STORAGE_KEY = 'markdownEditorContent';

const getDefaultState = () => ({
	title: '無題のドキュメント',
	blocks: [
		{ id: uuidv4(), type: 'heading', content: 'ようこそ！', level: 2 },
		{ id: uuidv4(), type: 'paragraph',
			content: '「挿入」ボタンからブロックを選択し、Markdown を作成できます。\n\n' +
				'操作についての説明は、右上にあるメニューから「本アプリについて」を参照ください。',
		},
	],
});

function App() {
	const [title, setTitle] = useState(() => {
		const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
		return saved ? JSON.parse(saved).title : getDefaultState().title;
	});
	const [blocks, setBlocks] = useState(() => {
		const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
		return saved ? JSON.parse(saved).blocks : getDefaultState().blocks;
	});

  // フォーカス対象のリスト項目ID
	const [focusedItemId, setFocusedItemId] = useState(null);

	// --- localStorage への保存 ---
	useEffect(() => {
		const dataToSave = JSON.stringify({ title, blocks });
		localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
	}, [title, blocks]);

  // --- JSONデータロード処理 ---
  const loadDataFromJsonString = useCallback((jsonString) => {
    if (!jsonString) {
      alert('読み込むデータが空です。');
      return;
    }
    try {
      const parsedData = JSON.parse(jsonString);
      // 簡単なバリデーション (title と blocks が存在するか)
      if (parsedData && typeof parsedData.title === 'string' && Array.isArray(parsedData.blocks)) {
        if (window.confirm('現在の内容をファイルから読み込んだデータで上書きしてもよろしいですか？')) {
          setTitle(parsedData.title);
          setBlocks(parsedData.blocks);
          // localStorage も更新 (useEffectが後で実行されるが、即時反映のためにも設定)
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedData));
          alert('JSONデータを正常にロードしました。');
        }
      } else {
        alert('無効なJSONファイル形式です。title (文字列) と blocks (配列) プロパティが含まれている必要があります。');
      }
    } catch (error) {
      console.error('JSONデータのパースまたはロードに失敗しました:', error);
      alert('JSONファイルの読み込みに失敗しました。ファイルが正しいJSON形式であることを確認してください。');
    }
  }, [setTitle, setBlocks]);

	// --- 初期化処理 ---
	const initializeEditor = useCallback(() => {
		if (window.confirm('現在の内容を破棄して新規作成しますか？')) {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
			const defaultState = getDefaultState();
			setTitle(defaultState.title);
			setBlocks(defaultState.blocks);
			setFocusedItemId(null); // フォーカス状態もリセット
		}
	}, []);

	// --- ブロック操作関数 ---
	const addBlock = useCallback((index, type) => {
		const newBlock = {
			id: uuidv4(),
			type: type,
			content: '',
			level: 2,
			language: '',
			items: type === 'orderedList' || type === 'unorderedList' ? [{ id: uuidv4(), content: '' }] : [],
		};
		setBlocks(prevBlocks => {
			const newBlocks = [...prevBlocks];
			newBlocks.splice(index + 1, 0, newBlock);
			return newBlocks;
		});
	}, []);

	const updateBlock = useCallback((id, updates) => {
		setBlocks(prevBlocks =>
			prevBlocks.map(block =>
				block.id === id ? { ...block, ...updates } : block
			)
		);
	}, []);

	const deleteBlock = useCallback((id) => {
		setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
	}, []);

	const moveBlock = useCallback((id, direction) => {
		setBlocks(prevBlocks => {
			const index = prevBlocks.findIndex(block => block.id === id);
			if (index === -1) return prevBlocks;
			const newIndex = direction === 'up' ? index - 1 : index + 1;
			if (newIndex < 0 || newIndex >= prevBlocks.length) return prevBlocks;
			const newBlocks = [...prevBlocks];
			const [movedBlock] = newBlocks.splice(index, 1);
			newBlocks.splice(newIndex, 0, movedBlock);
			return newBlocks;
		});
	}, []);

	// --- リスト項目操作 (フォーカス管理追加) ---
	const addListItem = useCallback((blockId, itemIndex) => {
		const newItemId = uuidv4(); // 新しいアイテムのIDを生成
		setBlocks(prevBlocks => prevBlocks.map(block => {
			if (block.id === blockId && (block.type === 'orderedList' || block.type === 'unorderedList')) {
				const newItems = [...block.items];
				newItems.splice(itemIndex + 1, 0, { id: newItemId, content: '' });
				return { ...block, items: newItems };
			}
			return block;
		}));
    // 新しく追加したアイテムにフォーカスを当てるよう設定
		setFocusedItemId(newItemId);
	}, []);

	const updateListItem = useCallback((blockId, itemId, content) => {
		setBlocks(prevBlocks => prevBlocks.map(block => {
			if (block.id === blockId && block.items) {
				const newItems = block.items.map(item =>
					item.id === itemId ? { ...item, content } : item
				);
				return { ...block, items: newItems };
			}
			return block;
		}));
	}, []);

	const deleteListItem = useCallback((blockId, itemId) => {
		setBlocks(prevBlocks => prevBlocks.map(block => {
			if (block.id === blockId && block.items) {
				const itemIndex = block.items.findIndex(item => item.id === itemId);
				// アイテムが1つしかない場合は削除しないか、リストブロック自体を削除
				if (block.items.length <= 1 && itemIndex !== -1) {
					const newItems = block.items.filter(item => item.id !== itemId);
					// アイテムが0になった場合、ブロック自体を削除するなら null を返し、上位で filter(Boolean)
					return newItems.length > 0 ? { ...block, items: newItems } : null;
				}

				const newItems = block.items.filter(item => item.id !== itemId);

				// 削除後にフォーカスを前のアイテムに移す
				if (itemIndex > 0 && newItems.length > 0) {
							const prevItemId = newItems[itemIndex - 1]?.id;
							if(prevItemId) setFocusedItemId(prevItemId);
				}

				return { ...block, items: newItems };
			}
			return block;
		}).filter(Boolean)); // `return newItems.length > 0` で null を貰った場合、ブロック削除
	}, []);

	const moveListItem = useCallback((blockId, itemId, direction) => {
		setBlocks(prevBlocks => prevBlocks.map(block => {
			if (block.id === blockId && block.items) {
				const index = block.items.findIndex(item => item.id === itemId);
				if (index === -1) return block;
				const newIndex = direction === 'up' ? index - 1 : index + 1;
				if (newIndex < 0 || newIndex >= block.items.length) return block;
				const newItems = [...block.items];
				const [movedItem] = newItems.splice(index, 1);
				newItems.splice(newIndex, 0, movedItem);
				return { ...block, items: newItems };
			}
			return block;
		}));
	}, []);

	// フォーカスが当たったことを子コンポーネントから通知され、状態をクリアする
	const clearFocusedItem = useCallback(() => {
		setFocusedItemId(null);
	}, []);


	// --- 書き出し処理 ---
	const handleExportMarkdown = useCallback(() => {
		const markdown = generateMarkdown(title, blocks);
		navigator.clipboard.writeText(markdown)
			.then(() => alert('クリップボードにコピーしました'))
			.catch(err => console.error('クリップボードへのコピーに失敗しました:', err));
	}, [title, blocks]);

	const handleSaveMarkdownFile = useCallback(() => {
		const markdown = generateMarkdown(title, blocks);
		saveAsMarkdown(markdown, title);
	}, [title, blocks]);

	return (
		<React.Fragment>
			<GlobalMenu
				title={title}
				setTitle={setTitle}
				blocks={blocks}
				onExport={handleExportMarkdown}
				onSave={handleSaveMarkdownFile}
				onNew={initializeEditor}
        onLoadJsonData={loadDataFromJsonString}
			/>
			<Editor
				blocks={blocks}
				focusedItemId={focusedItemId}
				onClearFocusedItem={clearFocusedItem}
				onAddBlock={addBlock}
				onUpdateBlock={updateBlock}
				onDeleteBlock={deleteBlock}
				onMoveBlock={moveBlock}
				onAddListItem={addListItem}
				onUpdateListItem={updateListItem}
				onDeleteListItem={deleteListItem}
				onMoveListItem={moveListItem}
			/>
		</React.Fragment>
	);
}

export default App;
