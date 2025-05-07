import React from 'react';
import './HrBlock.css';

function HrBlock() {
	// 操作は BlockControls で行うので、ここでは表示のみ
	return(
		<React.Fragment>
			{/* 他のブロックと違い、ラベル的なテキストはAOM上から除去（繰り返しになるだけなので） */}
			<span className='hr-block-title' aria-hidden="true">区切り線</span>
			<div className='hr-block'>
				<hr />
			</div>
		</React.Fragment>
	);
}

export default HrBlock;
