import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import INVOICE_CHANNEL from '@salesforce/messageChannel/InvoiceMessageChannel__c';

export default class GlobalSearch extends LightningElement {
    
    // Wire the MessageContext to the component's lifecycle
    @wire(MessageContext)
    messageContext;

    // Timer variable for debouncing
    delayTimeout;

    handleInputChange(event) {
        const searchValue = event.target.value;

        // Debouncing logic: Wait 300ms after the user stops typing
        window.clearTimeout(this.delayTimeout);
        
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delayTimeout = setTimeout(() => {
            this.publishSearchMessage(searchValue);
        }, 300);
    }

    publishSearchMessage(term) {
        const payload = {
            searchTerm: term,
            source: 'GlobalSearchComponent'
        };

        // Send the message to anyone listening on this channel
        publish(this.messageContext, INVOICE_CHANNEL, payload);
        
        console.log('Published Search Term:', term);
    }
}