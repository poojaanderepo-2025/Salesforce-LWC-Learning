import { LightningElement, wire, track, api } from 'lwc';
import getEmployeesByDept from '@salesforce/apex/EmployeeController.getEmployeesByDept';
import updateEmployeeBonuses from '@salesforce/apex/CompensationController.updateEmployeeBonuses';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import PERFORMANCE_RATING_FIELD from '@salesforce/schema/Employee__c.Performance_Rating__c';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CompensationDashboard extends LightningElement {
    @api userDept = 'Sales';
    @track employeeData = [];
    @track ratingOptions = [];
    @track draftValues = [];
    
    wiredEmployeeResult;

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: PERFORMANCE_RATING_FIELD })
    wiredPicklist({ error, data }) {
        if (data) {
            this.ratingOptions = data.values;
        } else if (error) {
            // FIX 1: We use 'error' here to satisfy the "defined but never used" rule
            this.showToast('Error Loading Picklist', error.body.message, 'error');
        }
    }

    @wire(getEmployeesByDept, { department: '$userDept' })
    wiredEmployees(result) {
        this.wiredEmployeeResult = result;
        if (result.data) {
            this.employeeData = result.data.map(row => {
                return { ...row, lastViewedTime: new Date(row.SystemModStamp).getTime() };
            });
        } else if (result.error) {
            // FIX 1: Using 'error' again
            this.showToast('Error Loading Employees', result.error.body.message, 'error');
        }
    }

    // FIX 2: Added return values to ensure the async method satisfies the "Expected return" rule
    async handleSave(event) {
        const updatedFields = event.detail.draftValues;

        const recordsToUpdate = updatedFields.map(draft => {
            const original = this.employeeData.find(row => row.Id === draft.Id);
            return { ...draft, lastViewedTime: original ? original.lastViewedTime : null };
        });

        try {
            await updateEmployeeBonuses({ draftValues: recordsToUpdate });
            
            this.showToast('Success', 'Compensation updated', 'success');

            this.draftValues = [];
            await refreshApex(this.wiredEmployeeResult);
            return true; // Return a boolean or value to satisfy ESLint
        } catch (err) {
            this.showToast('Update Failed', err.body.message, 'error');
            return false; // Return a value in the catch block as well
        }
    }

    // Helper method to keep code DRY and use Toast imports correctly
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}