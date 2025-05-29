import React from 'react';
import './BlockControls.css';

function BlockControls({
	blockId, blockType, level, language,
	onDelete, onMoveUp, onMoveDown,
	onLevelChange, onLanguageChange,
	showLevelControls, showLanguageInput
}) {

	const handleLevelSelect = (e) => {
		const newLevel = parseInt(e.target.value, 10);
		if (newLevel >= 2 && newLevel <= 5) {
			onLevelChange(newLevel);
		}
	};

	const handleLanguageInputChange = (e) => {
		onLanguageChange(e.target.value);
	}

	return (
		<div className='block-controls'>
			{/* 移動・削除ボタン */}
			<button className='block-controls-button' onClick={onMoveUp} aria-label='ブロック移動（上）'>↑</button>
			<button className='block-controls-button' onClick={onMoveDown} aria-label='ブロック移動（下）'>↓</button>
			<button className='block-controls-button' onClick={onDelete} aria-label='ブロック削除'>削除</button>
			{/* 見出しレベル選択 */}
			{showLevelControls && (
				<div className='block-controls-input'>
					<label htmlFor={`level-${blockId}`}>レベル：</label>
					<div className='level-select'>
						<select id={`level-${blockId}`} value={level} onChange={handleLevelSelect}>
							<option value={2}>2</option>
							<option value={3}>3</option>
							<option value={4}>4</option>
							<option value={5}>5</option>
						</select>
						<svg role="graphics-symbol img" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 17.1L3 8L4 7L12 15L20 7L21 8L12 17.1Z"/>
						</svg>
					</div>
				</div>
			)}
			{/* コード言語入力 */}
			{showLanguageInput && (
				<div className='block-controls-input'>
					<label htmlFor={`language-${blockId}`}>言語：</label>
					<input
						className='language-input'
						id={`language-${blockId}`}
						type="text"
						value={language || ''}
						onChange={handleLanguageInputChange}
						placeholder="例）java"
					/>
				</div>
			)}
		</div>
	);
}

export default BlockControls;
