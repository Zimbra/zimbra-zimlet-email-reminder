import { createElement } from 'preact';
import { withIntl } from '../../enhancers';
import { ModalDialog } from '@zimbra-client/components';
import { htmlToText } from '@zimbra-client/util';

const ConfirmModal = ({ onClose, onAction, zimletStrings, emailData }) => {
	let message;
	let body;
	//A conversation is selected, take newest message
	if (Array.isArray(emailData.messages)) {
		message = emailData.messages[0];
	}
	else {
		message = emailData;
	}

	if (message.html) {
		body = htmlToText(message.html);
	}
	else {
		body = message.text;
	}

	let date = new Date();
	let local = new Date(date);
	local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	let currentTimeDate = local.toJSON().substring(0, 19);

	return (
		<ModalDialog
			title={zimletStrings.menuItem}
			onAction={onAction}
			onClose={onClose}
			actionLabel="buttons.ok"
		>
			<p>
				{zimletStrings.remindMeText}<br />
				<input class="zimbra-client_text-input_input" style="width:100%" id="zimbraZimletEmailRemindTitle" value={message.subject} type="text" /><br />
				{zimletStrings.dateTime}<br />
				<input class="zimbra-client_text-input_input" style="width:100%" id="zimbraZimletEmailRemindDateTime" min={currentTimeDate} value={currentTimeDate} type="datetime-local" /><br />
				{zimletStrings.notes}<br />
				<textarea class="zimbra-client_text-input_input" style="width:100%" id="zimbraZimletEmailRemindNotes" value={body} rows="10" />

			</p>
		</ModalDialog>
	);
};

export default withIntl()(ConfirmModal);
