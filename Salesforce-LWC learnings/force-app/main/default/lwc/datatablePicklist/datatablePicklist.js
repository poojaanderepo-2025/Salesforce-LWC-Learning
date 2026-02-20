import { LightningElement, api } from 'lwc';

export default class DatatablePicklist extends LightningElement {
    @api label;
    @api placeholder;
    @api options;
    @api value;
    @api context; // This is usually the Record ID
    @api fieldName;

    handleChange(event) {
        const editValue = event.detail.value;
        
        // Fire a custom event that the lightning-datatable understands
        this.dispatchEvent(new CustomEvent('picklistchange', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
                data: {
                    context: this.context,
                    value: editValue,
                    fieldName: this.fieldName
                }
            }
        }));
    }
}