import React from 'react';
import './HeadingBlock.css';

function HeadingBlock({ controlId, content, level, onContentChange, onLevelChange }) {
	const handleInputChange = (event) => {
		onContentChange(event.target.value);
	};

	return (
		<div className='heading-block'>
			<label className='heading-block-label' htmlFor={controlId}>見出し（レベル：{level}）</label>
			<input
				id={controlId}
				type="text"
				className={`heading-block-input heading-block-input--lv${level}`}
				value={content}
				onChange={handleInputChange}
				placeholder={`見出しレベル ${level} テキスト`}
			/>
		</div>
	);
}

export default HeadingBlock;
