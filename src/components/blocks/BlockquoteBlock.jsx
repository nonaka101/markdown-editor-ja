import React from 'react';
import './BlockquoteBlock.css';

function BlockquoteBlock({ controlId, content, onContentChange }) {
	const handleTextChange = (event) => {
		onContentChange(event.target.value);
	};

	// textarea をダブルクリックした際、コンテンツ内容から適切な `rows` を設定
	const handleDoubleClick = (event) => {
		const lines = event.target.value.split('\n').length;
		const rows = Math.max(3, lines);
		event.target.setAttribute('rows', rows);
	}

	return (
		<div className='blockquote-block'>
			<label htmlFor={controlId}>引用文</label>
			<textarea
				id={controlId}
				value={content}
				onChange={handleTextChange}
				placeholder="引用文を入力..."
				rows={3}
				onDoubleClick={handleDoubleClick}
			/>
		</div>
	);
}

export default BlockquoteBlock;
