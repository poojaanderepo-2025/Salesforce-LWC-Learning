import { LightningElement,track} from 'lwc';

export default class LifeCycleHookLogger extends LightningElement {
    @track dummyProperty = 0;
    
    constructor() {
        super();
        console.log('%c1. Constructor Triggered', 'color: green; font-weight: bold');
    }
    connectedCallback() {
        console.log('%c2. connectedCallback Triggered', 'color: green; font-weight: bold');
    }
    renderedCallback() {
        console.log('%c3. renderedCallback Triggered', 'color: green; font-weight: bold');
    }
    disconnectedCallback() {
        console.log('%c4. disconnectedCallback Triggered', 'color: green; font-weight: bold');
    }   
    errorCallback(error, stack) {
        console.log('%c5. errorCallback Triggered', 'color: green; font-weight: bold');
    }
    handleRender() {
        // Changing a tracked property forces a re-render
        this.dummyProperty++;
    }
}