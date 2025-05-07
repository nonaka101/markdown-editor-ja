import React from 'react';
import Block from './Block';
import './Editor.css';

function Editor({ blocks, focusedItemId, onClearFocusedItem, onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, onAddListItem, onUpdateListItem, onDeleteListItem, onMoveListItem }) {
	const visibleBlocks = blocks;

	return (
		<main className='editor'>
			{visibleBlocks.map((block, index) => (
				<Block
					key={block.id}
					block={block}
					index={index}
					focusedItemId={focusedItemId}
					onClearFocusedItem={onClearFocusedItem}
					onAddBlock={onAddBlock}
					onUpdateBlock={onUpdateBlock}
					onDeleteBlock={onDeleteBlock}
					onMoveBlock={onMoveBlock}
					onAddListItem={onAddListItem}
					onUpdateListItem={onUpdateListItem}
					onDeleteListItem={onDeleteListItem}
					onMoveListItem={onMoveListItem}
				/>
			))}
		</main>
	);
}

export default Editor;
