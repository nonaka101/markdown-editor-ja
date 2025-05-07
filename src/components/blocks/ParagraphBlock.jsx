import React from 'react';
import './ParagraphBlock.css';

function ParagraphBlock({ controlId, content, onContentChange }) {
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
		<div className='paragraph-block'>
			<label htmlFor={controlId}>文章</label>
			<textarea
				id={controlId}
				value={content}
				onChange={handleTextChange}
				placeholder="文章を入力..."
				rows={3}
				onDoubleClick={handleDoubleClick}
			/>
		</div>
	);
}

export default ParagraphBlock;
