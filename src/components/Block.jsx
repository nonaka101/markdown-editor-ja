import React, { useRef } from 'react'; // useState を削除し、useRef を追加
import BlockControls from './BlockControls';
import AddBlockButton from './AddBlockButton';
import AddBlockDialog from './AddBlockDialog';
import HeadingBlock from './blocks/HeadingBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import BlockquoteBlock from './blocks/BlockquoteBlock';
import ListBlock from './blocks/ListBlock';
import HrBlock from './blocks/HrBlock';
import CodeBlock from './blocks/CodeBlock';
import './Block.css';

function Block({ block, index, focusedItemId, onClearFocusedItem, onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, onAddListItem, onUpdateListItem, onDeleteListItem, onMoveListItem }) {
	const dialogRef = useRef(null); // dialog 要素への参照

	// --- コンテンツ更新ハンドラ ---
	const handleContentChange = (newContent) => onUpdateBlock(block.id, { content: newContent });
	const handleLevelChange = (newLevel) => onUpdateBlock(block.id, { level: newLevel });
	const handleLanguageChange = (newLanguage) => onUpdateBlock(block.id, { language: newLanguage });

	// --- ブロックコンテンツのレンダリング ---
	const renderBlockContent = () => {
		switch (block.type) {
			case 'heading':
				return <HeadingBlock
					controlId={'heading-'+block.id}
					content={block.content}
					level={block.level}
					onContentChange={handleContentChange}
					onLevelChange={handleLevelChange}
				/>;
			case 'paragraph':
				return <ParagraphBlock
					controlId={'paragraph-'+block.id}
					content={block.content}
					onContentChange={handleContentChange}
				/>;
			case 'blockquote':
				return <BlockquoteBlock
					controlId={'blockquote-'+block.id}
					content={block.content}
					onContentChange={handleContentChange}
				/>;
			case 'orderedList':
			case 'unorderedList':
				return <ListBlock
					// リストに関しては controlId はなし
					block={block}
					focusedItemId={focusedItemId}
					onClearFocusedItem={onClearFocusedItem}
					onAddListItem={onAddListItem}
					onUpdateListItem={onUpdateListItem}
					onDeleteListItem={onDeleteListItem}
					onMoveListItem={onMoveListItem}
				/>;
			case 'horizontalRule':
				return <HrBlock />;
			case 'code':
				return <CodeBlock
					controlId={'code-'+block.id}
					content={block.content}
					language={block.language}
					onContentChange={handleContentChange}
					onLanguageChange={handleLanguageChange}
				/>;
			default:
				return null;
		}
	};

	// --- ダイアログ制御 ---
	const openAddDialog = () => {
		if (dialogRef.current) {
			dialogRef.current.showModal(); // dialog をモーダルで開く
		}
	};

	const handleAddBlockSelect = (type) => {
		onAddBlock(index, type);
	};

	return (
		<div id={`block-${block.id}`} className={`block block-${block.type}`}>
			{/* ブロックコンテンツ本体 */}
			<div className='block-body'>
				{renderBlockContent()}
			</div>
			{/* フッター（要素操作、ブロック追加） */}
			<div className='block-footer'>
				<BlockControls
					blockId={block.id}
					blockType={block.type}
					level={block.level}
					language={block.language} // コードブロックの言語表示/編集用
					onDelete={() => onDeleteBlock(block.id)}
					onMoveUp={() => onMoveBlock(block.id, 'up')}
					onMoveDown={() => onMoveBlock(block.id, 'down')}
					onLevelChange={handleLevelChange}
					onLanguageChange={handleLanguageChange}
					showLevelControls={block.type === 'heading'}
					showLanguageInput={block.type === 'code'}
				/>
				<AddBlockButton onClick={openAddDialog} />
			</div>
			{/* ブロック追加ダイアログ (表示は showModal で制御) */}
			<AddBlockDialog ref={dialogRef} onSelect={handleAddBlockSelect} />
		</div>
	);
}

export default Block;
