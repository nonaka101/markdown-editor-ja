import React from 'react';
import './CodeBlock.css';

// 言語入力は BlockControls 側、ここでは textarea のみ
function CodeBlock({ controlId, content, onContentChange }) {
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
		<div className='code-block'>
			<label htmlFor={controlId}>コード</label>
			<textarea
				id={controlId}
				value={content}
				onChange={handleTextChange}
				placeholder="コードを入力..."
				rows={3}
				onDoubleClick={handleDoubleClick}
			/>
		</div>
	);
}

export default CodeBlock;
