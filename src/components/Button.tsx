import * as React from 'react';
import classNames from 'classnames';

interface Props {
	autoWidth?: boolean;
	children?: React.ReactNode;
	className?: string;
	disabled?: boolean;
	flat?: boolean;
	fullWidth?: boolean;
	onClick?: () => void;
	primary?: boolean;
	round?: boolean;
	[id: string]: any;
}

export default (props: Props) => {
	const { autoWidth, primary, flat, fullWidth, disabled, round, children, onClick, ...other } = props;
	let { className } = props;

	className = classNames(className, {
		'btn': true,
		'btn-round': round,
		'btn-text': !round,
		'btn-primary': primary,
		'btn-flat': flat,
		'autoWidth': autoWidth,
		'fullWidth': fullWidth,
		'disabled': disabled
	});

	return (
		<div {...other} className={className} onClick={disabled ? undefined : onClick}>
			{children}
		</div>
	);
};