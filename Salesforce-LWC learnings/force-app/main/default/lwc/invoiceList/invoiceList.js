import { LightningElement,api } from 'lwc';

export default class InvoiceList extends LightningElement 
{
    _rawInvoices = []; // Private internal variable
    formattedInvoices = [];

    @api 
    get invoices() {
        return this._rawInvoices;
    }

    set invoices(value) {
        // Logic: Intercept the data from the parent
        this._rawInvoices = value;

        // Process data: Add a CSS class based on the amount
        this.formattedInvoices = value.map(inv => ({
            ...inv,
            badgeClass: inv.amount > 500 ? 'slds-theme_error' : 'slds-theme_success'
        }));
    }
    handleDeleteClick(event) {
        // Get the ID from the data-id attribute we set in HTML
        const invoiceId = event.target.dataset.id;

        // 1. Create the Custom Event
        const deleteEvent = new CustomEvent('deleteinvoice', {
            detail: invoiceId
        });

        // 2. Dispatch it to the Parent
        this.dispatchEvent(deleteEvent);
    }
}