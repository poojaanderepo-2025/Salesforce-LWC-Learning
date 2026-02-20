// Add 'api' to the list of imports here
import { api } from 'lwc';
import LightningDatatable from 'lightning/datatable';
import picklistTemplate from './picklistTemplate.html';
import getDynamicColumns from '@salesforce/apex/CompensationController.getDynamicColumns';
import updateEmployeeBonuses from '@salesforce/apex/CompensationController.updateEmployeeBonuses';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MyCustomDatatable extends LightningDatatable 
{
    constructor() 
    {
            super();
            // Listen for the custom event from our picklist component
            this.addEventListener('picklistchange', (event) => {
            const { data } = event.detail;
        
            // Update the internal draft values of the datatable
            // This makes the cell turn yellow and enables the Save button
            this.updateDraftValues(data);
        });
    }

    updateDraftValues(updateItem) 
    {
        let draftValues = [...this.draftValues];
        let copyDraftValues = [...draftValues];
    
        // Logic to merge the new picklist selection into the table's draftValues array
        let itemIndex = copyDraftValues.findIndex(item => item.Id === updateItem.context);
    
        if (itemIndex > -1) 
        {
            copyDraftValues[itemIndex][updateItem.fieldName] = updateItem.value;
        } 
        else 
        {
            copyDraftValues.push({
                Id: updateItem.context,
                [updateItem.fieldName]: updateItem.value
            });
        }
        this.draftValues = copyDraftValues;
    }

    // 1. Define Custom Types
    static customTypes = {
        picklist: {
            template: picklistTemplate,
            standardCellLayout: true,
            typeAttributes: ['label', 'placeholder', 'options', 'value', 'context'],
        }
    };

    // Properties to be passed from parent
    @api userDept; 
    @api ratingOptions;
    @api wiredResult; // To hold the provisioned data for refreshApex

    async connectedCallback() {
        try {
            // 1. Fetch dynamic column config
            const columnConfig = await getDynamicColumns({ department: this.userDept });
            
            // 2. Map and assign columns (Fixes 'getDynamicColumns' usage)
            this.columns = [
                ...columnConfig,
                { 
                    label: 'Rating', 
                    type: 'picklist', 
                    fieldName: 'Rating__c',
                    typeAttributes: {
                        options: this.ratingOptions,
                        value: { fieldName: 'Rating__c' },
                        context: { fieldName: 'Id' }
                    }
                },
                { type: 'action', typeAttributes: { rowActions: this.getRowActions } }
            ];
        } catch (error) {
            this.processError(error);
        }
    }

    // 3. This method resolves 'updateEmployeeBonuses', 'refreshApex', and 'ShowToastEvent' usage
    @api
    async handleTableSave(event) {
        const draftValues = event.detail.draftValues;

        try {
            // Call the Imperative Apex method
            await updateEmployeeBonuses({ draftValues: draftValues });

            // Dispatch success toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records updated successfully',
                    variant: 'success'
                })
            );

            // Clear draft values to remove yellow highlights
            this.draftValues = [];

            // Refresh the cache to show new data
            if (this.wiredResult) {
                await refreshApex(this.wiredResult);
            }
        } catch (error) {
            this.processError(error);
        }
    }

    processError(error) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: error.body ? error.body.message : error.message,
                variant: 'error'
            })
        );
    }
}