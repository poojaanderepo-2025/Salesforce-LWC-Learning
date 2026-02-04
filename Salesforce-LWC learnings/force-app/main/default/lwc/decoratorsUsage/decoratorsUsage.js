import { LightningElement,api,track,wire} from 'lwc';
// 1. Import the Wire adapter
import { getRecord } from 'lightning/uiRecordApi';
// 2. Import a reference to the current User ID
import USER_ID from '@salesforce/user/Id';
// 3. Import specific fields you want to show
import NAME_FIELD from '@salesforce/schema/User.Name';
import EMAIL_FIELD from '@salesforce/schema/User.Email';

export default class DecoratorsUsage extends LightningElement 
{
    // @api property: Exposes this to the Lightning App Builder
    @api componentTitle = 'Default Billing Monitor';

    // @track array: Tracks internal changes to the list
    @track billingLogs = [
        { id: 1, message: 'System Initialized' }
    ];

    userId = USER_ID;

    handleAddItem() {
        const newId = this.billingLogs.length + 1;
        const newEntry = { id: newId, message: `Manual Log Entry #${newId}` };
        
        // Use the Spread Operator to update the array reference
        // This is a "Best Practice" to ensure LWC detects the change immediately
        this.billingLogs = [...this.billingLogs, newEntry];
    }

    // 4. Use @wire to fetch the data
    @wire(getRecord, { recordId: '$userId', fields: [NAME_FIELD, EMAIL_FIELD] })
    user;

    // 5. Use Getters to extract the data safely
    get userName() {
        return this.user.data ? this.user.data.fields.Name.value : 'Loading...';
    }

    get userEmail() {
        return this.user.data ? this.user.data.fields.Email.value : '';
    }
}