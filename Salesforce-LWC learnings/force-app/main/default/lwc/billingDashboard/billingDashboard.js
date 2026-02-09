import { LightningElement,track,wire } from 'lwc';
import { subscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import INVOICE_CHANNEL from '@salesforce/messageChannel/InvoiceMessageChannel__c';

export default class BillingDashboard extends LightningElement 
{
    @track myInvoices = [
        { id: 'INV-101', amount: 1200, status: 'Overdue' },
        { id: 'INV-102', amount: 450, status: 'Paid' },
        { id: 'INV-103', amount: 80, status: 'Paid' }
    ];
    @track filteredInvoices = []; // This is what the HTML template iterates over
    subscription = null;

    @wire(MessageContext)
    messageContext;

    // 4. Subscribe when the component loads
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        // Senior Move: Clean up the subscription to prevent memory leaks
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                INVOICE_CHANNEL,
                (message) => this.handleMessage(message),
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    // Logic: Listen for the Search Term from the Global Search Component
    handleMessage(message) {
        const term = message.searchTerm ? message.searchTerm.toLowerCase() : '';
        
        // Always filter against the MASTER list (myInvoices)
        this.filteredInvoices = this.myInvoices.filter(inv => 
            inv.id.toLowerCase().includes(term)
        );
    }

    applyFiltering() {
        if (this.searchTerm) {
            this.filteredInvoices = this.allInvoices.filter(inv => 
                inv.id.toLowerCase().includes(this.searchTerm)
            );
        } else {
            this.filteredInvoices = [...this.allInvoices];
        }
    }

    handleRefresh() {
        // Simulate a data change - LWC will automatically push this to the child
        this.myInvoices = [...this.myInvoices, { id: 'INV-104', amount: 600, status: 'Pending' }];
    }

    handleDeleteInvoice(event) {
    const idToDelete = event.detail; // This is the 'invoiceId' from the child

    // Use .filter() to create a NEW array without the deleted ID
    // Remember: We must change the reference for LWC to detect the change!
    this.myInvoices = this.myInvoices.filter(inv => inv.id !== idToDelete);
    // 2. Dispatch the Toast Notification
        const toast = new ShowToastEvent({
            title: 'Success!',
            message: `Invoice ${idToDelete} was deleted.`,
            variant: 'success', // Options: success, error, warning, info
            mode: 'dismissible' // Stays until user clicks X or 3 seconds pass
        });
        
        this.dispatchEvent(toast);
}
}