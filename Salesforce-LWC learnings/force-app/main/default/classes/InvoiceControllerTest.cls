@IsTest
private class InvoiceControllerTest {

    @TestSetup
    static void setupData() {
        // Create a test user to verify 'With Sharing' and User Mode
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User'];
        User testUser = new User(
            Alias = 'stuser', Email='standarduser@testorg.com',
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US',
            LocaleSidKey='en_US', ProfileId = p.Id,
            TimeZoneSidKey='America/Los_Angeles', UserName='inv_test_user@test.com'
        );
        insert testUser;

        // Create initial test data
        List<Invoice__c> invoices = new List<Invoice__c>();
        for(Integer i=0; i<10; i++) {
            invoices.add(new Invoice__c(
                Status__c = 'Pending'
            ));
        }
        insert invoices;
    }

    @IsTest
    static void testGetPendingInvoices() {
        User u = [SELECT Id FROM User WHERE UserName='inv_test_user@test.com'];
        
        System.runAs(u) {
            Test.startTest();
            List<Invoice__c> results = InvoiceController.getPendingInvoices();
            Test.stopTest();

            Assert.areEqual(10, results.size(), 'Should return all 10 pending invoices');
            Assert.areEqual('Pending', results[0].Status__c, 'Status should be Pending');
        }
    }

    @IsTest
    static void testUpdateInvoiceStatusBulk() {
        List<Invoice__c> pendingInvoices = [SELECT Id FROM Invoice__c WHERE Status__c = 'Pending'];
        List<Id> idsToUpdate = new List<Id>();
        for(Invoice__c inv : pendingInvoices) {
            idsToUpdate.add(inv.Id);
        }

        Test.startTest();
        InvoiceController.updateInvoiceStatus(idsToUpdate);
        Test.stopTest();

        // Validate the update
        List<Invoice__c> updatedInvoices = [SELECT Status__c FROM Invoice__c WHERE Id IN :idsToUpdate];
        for(Invoice__c inv : updatedInvoices) {
            Assert.areEqual('Paid', inv.Status__c, 'Invoice status should have transitioned to Paid');
        }
    }

    @IsTest
    static void testUpdateInvoiceStatusEmptyList() {
        // Testing negative/edge case: Empty list should not crash
        Test.startTest();
        try {
            InvoiceController.updateInvoiceStatus(new List<Id>());
            Assert.isTrue(true, 'Should handle empty list gracefully');
        } catch(Exception e) {
            Assert.fail('Should not throw exception on empty list: ' + e.getMessage());
        }
        Test.stopTest();
    }
}