import * as React from 'react';
import { Action } from 'redux';
import { Alert as AlertOptions, UIMessages } from '../types/data.d';
import { _translate } from '../utils/I18n';
import { Dialog } from './DialogNew';

export interface AlertProps {
	locale: UIMessages;
	options: AlertOptions | null;
	close(): void;
	dispatch(action: Action): void;
}

export class Alert extends React.Component<AlertProps> {
	render() {
		const { dispatch, options, locale, ...other } = this.props;
		let buttons;
		let message;
		let title;

		if (options) {
			const {
				buttons: buttonsOption = [{ label: 'OK', autoWidth: true }],
				message: messageOption,
				title: titleOption,
				confirm,
				confirmYesNo
			} = options;

			buttons = (confirm ? [
				{
					label: confirmYesNo ? _translate(locale, 'yes') : _translate(locale, 'ok'),
					dispatchOnClick: confirm[0]
				},
				{
					label: confirmYesNo ? _translate(locale, 'no') : _translate(locale, 'cancel'),
					dispatchOnClick: confirm[1]
				}
			] : buttonsOption).map(e => {
				const { dispatchOnClick, ...other } = e;
				return { ...other, onClick: () => {
					if (dispatchOnClick) {
						dispatch(dispatchOnClick);
					}
				}};
			});
			message = messageOption;
			title = titleOption;
		}

		return (
			<Dialog
				{...other}
				buttons={buttons}
				isOpened={options !== null}
				className="alert"
				title={title}
				>
				{message}
			</Dialog>
		);
	}
}