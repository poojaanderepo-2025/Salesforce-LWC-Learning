import { LightningElement,wire } from 'lwc';
// 1. Import LMS Utilities and the Channel
import { publish, MessageContext } from 'lightning/messageService';
import INVOICE_CHANNEL from '@salesforce/messageChannel/InvoiceMessageChannel__c';

export default class GlobalSearch extends LightningElement 
{
    @wire(MessageContext)
    messageContext;

    handleSearchChange(event) {
        const searchValue = event.target.value;
        
        // 2. Prepare the payload
        const payload = { searchTerm: searchValue };

        // 3. Send it to the world!
        publish(this.messageContext, INVOICE_CHANNEL, payload);
    }

}