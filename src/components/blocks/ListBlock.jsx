import React from 'react';
import ListItem from './ListItem';
import './ListBlock.css';

function ListBlock({ block, focusedItemId, onClearFocusedItem, onAddListItem, onUpdateListItem, onDeleteListItem, onMoveListItem }) {
	const Tag = block.type === 'orderedList' ? 'ol' : 'ul';

	return (
		<React.Fragment>
			<span className='list-block-title'>{Tag === 'ol' ? '順序付きリスト' : '順序なしリスト'}</span>
			<Tag className='list-block'>
				{block.items.map((item, index) => (
					<ListItem
						key={item.id}
						item={item}
						index={index}
						blockId={block.id}
						isFocused={item.id === focusedItemId}
						onClearFocusedItem={onClearFocusedItem}
						onUpdate={(content) => onUpdateListItem(block.id, item.id, content)}
						onDelete={() => onDeleteListItem(block.id, item.id)}
						onMoveUp={() => onMoveListItem(block.id, item.id, 'up')}
						onMoveDown={() => onMoveListItem(block.id, item.id, 'down')}
						onAddItemBelow={() => onAddListItem(block.id, index)}
					/>
				))}
			</Tag>
		</React.Fragment>
	);
}

export default ListBlock;
