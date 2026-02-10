import { LightningElement, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getPendingInvoices from '@salesforce/apex/InvoiceController.getPendingInvoices';
import updateInvoiceStatus from '@salesforce/apex/InvoiceController.updateInvoiceStatus';

// Define columns outside the class to prevent re-rendering on every cycle
const COLUMNS = [
    { label: 'Invoice Number', fieldName: 'Name', type: 'text' },
    { label: 'Amount', fieldName: 'Amount__c', type: 'currency' },
    { label: 'Status', fieldName: 'Status__c', type: 'text' }
];

export default class BulkInvoiceUpdater extends LightningElement 
{
    columns = COLUMNS;
    @track invoices = [];
    @track selectedIds = [];
    isLoading = false;
    wiredInvoiceResult; // Essential for refreshApex

    // 1. Wire the Apex method
    @wire(getPendingInvoices)
    processWiredData(result) {
        this.wiredInvoiceResult = result; // Store the provisioned object
        const { data, error } = result;
        if (data) {
            this.invoices = data;
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }

    // Getter for button state
    get isButtonDisabled() {
        return this.selectedIds.length === 0 || this.isLoading;
    }

    // Capture IDs of selected rows
    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedIds = selectedRows.map(row => row.Id);
    }

    // 2. Imperative call to update records
    async handleBulkPay() {
        this.isLoading = true;
        try {
            // Call Imperative Apex
            await updateInvoiceStatus({ invoiceIds: this.selectedIds });
            
            this.showToast('Success', `${this.selectedIds.length} Invoices Updated`, 'success');
            
            // 3. Lead Step: Refresh the Wire Cache to update UI
            await refreshApex(this.wiredInvoiceResult);
            
            // Clear selection after success
            this.template.querySelector('lightning-datatable').selectedRows = [];
            this.selectedIds = [];

        } catch (error) {
            this.showToast('Update Failed', error.body.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}