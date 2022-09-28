import { createElement } from 'preact';
import { useContext, useCallback } from 'preact/hooks';
import { Text, IntlContext } from 'preact-i18n';
import { compose } from 'recompose';
import { withIntl } from '../../enhancers';
import { ActionMenuItem } from '@zimbra-client/components';
import ConfirmModal from './confirm-modal';
import { callWith } from '@zimbra-client/util';

function createMore(props, context) {
   const { intl } = useContext(IntlContext);
   const zimletStrings = intl.dictionary['zimbra-zimlet-email-reminder'];
   const menuHandler = useCallback(() => {
      moreMenuHandler(props, context, zimletStrings, props.emailData)
   }, [props, context, zimletStrings]);

   return (
      <ActionMenuItem onClick={menuHandler}>
         <Text id='zimbra-zimlet-email-reminder.menuItem' />
      </ActionMenuItem>
   );
}

function convertDate(dt) {
   let date = new Date(dt);
   let local = new Date(date);
   local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
   let icsDateTime = new Date(local).toISOString();
   icsDateTime= icsDateTime.replace(/-/g, "").replace(/:/g, "");
   icsDateTime = icsDateTime.slice(0, -5);
   return icsDateTime;
}
//https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
function makeIcsFile(date, summary, description, context) {
   let ics =
      "BEGIN:VCALENDAR\n" +
      "CALSCALE:GREGORIAN\n" +
      "METHOD:PUBLISH\n" +
      "PRODID:-//Zimbra-Email-Reminder//EN\n" +
      "VERSION:2.0\n" +
      "BEGIN:VEVENT\n" +
      "UID:"+uuidv4()+"\n" +
      "DTSTART;TZID=\""+Intl.DateTimeFormat().resolvedOptions().timeZone+"\":"+convertDate(date)+"\n" +
      "DTEND;TZID=\""+Intl.DateTimeFormat().resolvedOptions().timeZone+"\":"+convertDate(date)+"\n" +
      "SUMMARY:" +
      summary +
      "\n" +
      "DESCRIPTION:" +
      description.replace(/\n/g, '\\n').replace(/\r/g, '') +
      "\n" +
      "LOCATION:"+parent.window.location.href+"\n" +
      "STATUS:CONFIRMED\n" +
      "CLASS:PRIVATE\n" +
      "X-MICROSOFT-CDO-INTENDEDSTATUS:FREE\n" +
      "TRANSP:TRANSPARENT\n" +
      "BEGIN:VALARM\n" +
      "ACTION:DISPLAY\n" +
      "TRIGGER;RELATED=START:-PT5M\n" +
      "DESCRIPTION:Reminder\n" +
      "END:VALARM\n" +
      "BEGIN:VALARM\n" +
      "ACTION:EMAIL\n" +
      "TRIGGER;RELATED=START:-PT5M\n" +
      "DESCRIPTION:Reminder\n" +
      "SUMMARY:Reminder\n" +
      "ATTENDEE:mailto:"+context.getAccount().name+"\n" +
      "END:VALARM\n" +
      "END:VEVENT\n" +
      "END:VCALENDAR";
   return new File([ics], { type: "text/plain" });
}

//implements closing of the dialog
function removeModal(context) {
   const { dispatch } = context.store;
   dispatch(context.zimletRedux.actions.zimlets.addModal({ id: 'addEventModal' }));
}

function createAppointment(args, e) {
   const context = args[0];
   const zimletStrings = args[1];
   let file = makeIcsFile(window.parent.document.getElementById('zimbraZimletEmailRemindDateTime').value, window.parent.document.getElementById('zimbraZimletEmailRemindTitle').value, window.parent.document.getElementById('zimbraZimletEmailRemindNotes').value, context)
   let request = new XMLHttpRequest();
   let formData = new FormData();
   formData.append("file", file);
   request.open("POST", `/home/${context.getAccount().name}/Calendar?fmt=ics&charset=UTF-8`);
   request.onreadystatechange = function (e) {
      if ((request.readyState === 4) && (request.status === 200)) {
         const { dispatch } = context.store;
         dispatch(context.zimletRedux.actions.zimlets.addModal({ id: 'addEventModal' }));
         alert(context, zimletStrings.complete);
      }
   }
   request.send(formData);
}

/* Method to display a toaster to the user */
function alert(context, message) {
   const { dispatch } = context.store;
   dispatch(context.zimletRedux.actions.notifications.notify({
      message: message
   }));
}

function moreMenuHandler(props, context, zimletStrings, emailData) {
   const modal = (
      <ConfirmModal
         onClose={callWith(removeModal, context)}
         onAction={callWith(createAppointment, [context, zimletStrings])}
         zimletStrings={zimletStrings}
         emailData={emailData}
      />
   );
   const { dispatch } = context.store;
   dispatch(context.zimletRedux.actions.zimlets.addModal({ id: 'addEventModal', modal: modal }));
}

export default compose(withIntl())(createMore)
