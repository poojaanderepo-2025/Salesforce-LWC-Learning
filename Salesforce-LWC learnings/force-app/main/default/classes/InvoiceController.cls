public with sharing class InvoiceController {
    @AuraEnabled(cacheable=true)
    public static List<Invoice__c> getPendingInvoices() {
        return [SELECT Id, Name, Status__c 
                FROM Invoice__c 
                WHERE Status__c = 'Pending' 
                WITH USER_MODE];
    }
    @AuraEnabled
    public static void updateInvoiceStatus(List<Id> invoiceIds) {
        List<Invoice__c> toUpdate = new List<Invoice__c>();
        for(Id invId : invoiceIds) {
            toUpdate.add(new Invoice__c(Id = invId, Status__c = 'Paid'));
        }
        update as user toUpdate;
    }
}