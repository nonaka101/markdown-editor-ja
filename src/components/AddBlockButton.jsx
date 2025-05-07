import React from 'react';
import './AddBlockButton.css';

// 各 Block コンポーネント内で呼び出されるボタン
function AddBlockButton({ onClick }) {
	return (
		<button
			onClick={onClick}
			type='button'
			className="add-block-button"
			aria-label="ブロック新規追加"
		>
			挿入
		</button>
	);
}

export default AddBlockButton;
