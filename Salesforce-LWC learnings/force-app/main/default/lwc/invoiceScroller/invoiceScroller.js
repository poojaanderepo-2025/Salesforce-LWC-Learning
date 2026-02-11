import { LightningElement, track } from 'lwc';
import getInvoicesPaged from '@salesforce/apex/InvoicePaginationController.getInvoicesPaged';

const COLUMNS = [
    { label: 'Invoice #', fieldName: 'Name', type: 'text' },
    { label: 'Amount', fieldName: 'Amount__c', type: 'currency' },
    { label: 'Status', fieldName: 'Status__c', type: 'text' },
    { label: 'Date', fieldName: 'Date__c', type: 'date' }
];

export default class InvoiceScroller extends LightningElement {
    columns = COLUMNS;
    @track invoices = [];
    
    // Pagination State
    pageSize = 50;
    offset = 0;
    isLoading = false;
    loadMoreStatus = 'Scroll down to load more';

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        try {
            const result = await getInvoicesPaged({ 
                pageSize: this.pageSize, 
                offsetValue: this.offset 
            });

            // Lead Tip: Use the Spread Operator to merge new data with existing list
            // This preserves existing rows while adding new ones
            this.invoices = [...this.invoices, ...result];

            // If the server returns fewer records than requested, we've hit the end
            if (result.length < this.pageSize) {
                this.loadMoreStatus = 'No more records.';
                // Disable infinite loading on the datatable component
                const dt = this.template.querySelector('lightning-datatable');
                if (dt) dt.enableInfiniteLoading = false;
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handleLoadMore(event) {
        // Prevent multiple simultaneous fetches
        if (this.isLoading) return;

        const { target } = event;
        // Display the loading spinner inside the datatable
        target.isLoading = true;

        this.offset += this.pageSize;
        
        // Return the promise from loadData so the datatable knows when to hide its spinner
        this.loadData().then(() => {
            target.isLoading = false;
        });
    }
}