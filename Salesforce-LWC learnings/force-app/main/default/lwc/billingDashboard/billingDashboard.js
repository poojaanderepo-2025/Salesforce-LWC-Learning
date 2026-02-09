import { LightningElement,track } from 'lwc';

export default class BillingDashboard extends LightningElement 
{
    @track myInvoices = [
        { id: 'INV-101', amount: 1200, status: 'Overdue' },
        { id: 'INV-102', amount: 450, status: 'Paid' },
        { id: 'INV-103', amount: 80, status: 'Paid' }
    ];

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