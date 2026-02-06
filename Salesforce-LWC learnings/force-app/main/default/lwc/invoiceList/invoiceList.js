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
}