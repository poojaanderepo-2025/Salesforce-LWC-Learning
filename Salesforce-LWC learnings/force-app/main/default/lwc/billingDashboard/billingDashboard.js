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
}