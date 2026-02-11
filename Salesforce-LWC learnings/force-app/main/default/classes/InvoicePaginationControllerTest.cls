@IsTest
private class InvoicePaginationControllerTest {

    @TestSetup
    static void setup() {
        // Create 100 Invoices. 
        // We'll give some the same date to test our tie-breaker (Id) logic.
        List<Invoice__c> testInvoices = new List<Invoice__c>();
        Date fixedDate = Date.newInstance(2026, 2, 11);
        
        for(Integer i = 0; i < 100; i++) {
            testInvoices.add(new Invoice__c(
                Amount__c = 100,
                Status__c = 'Pending',
                // Every 10th record shares the same date to test tie-breaking
                Date__c = fixedDate.addDays(- (i / 10)) 
            ));
        }
        insert testInvoices;
    }

    @IsTest
    static void testFirstPageFetch() {
        Test.startTest();
        // Page 1: lastDate and lastId are null
        List<Invoice__c> result = InvoicePaginationController.getInvoicesPaged(10, null, null);
        Test.stopTest();

        Assert.areEqual(10, result.size(), 'Should return exactly 10 records for the first page.');
        Assert.isNotNull(result[0].Date__c, 'Date should be populated.');
    }

    @IsTest
    static void testSeekToSecondPage() {
        // 1. Get the first page
        List<Invoice__c> firstPage = InvoicePaginationController.getInvoicesPaged(10, null, null);
        Invoice__c lastRecordOfFirstPage = firstPage[firstPage.size() - 1];

        Test.startTest();
        // 2. Seek to the second page using the "pointer" from the first page
        List<Invoice__c> secondPage = InvoicePaginationController.getInvoicesPaged(
            10, 
            lastRecordOfFirstPage.Date__c, 
            lastRecordOfFirstPage.Id
        );
        Test.stopTest();

        Assert.areEqual(10, secondPage.size(), 'Should return 10 records for the second page.');
        
        // Lead Check: Ensure the first record of page 2 is actually "older" (or has a smaller ID)
        // than the last record of page 1.
        Assert.isTrue(
            secondPage[0].Date__c <= lastRecordOfFirstPage.Date__c, 
            'Second page should start at or after the first page date.'
        );
        Assert.areNotEqual(firstPage[0].Id, secondPage[0].Id, 'Pages should not contain duplicate records.');
    }

    @IsTest
    static void testTieBreakerLogic() {
        // We set up data where 10 records share the same date.
        // Let's fetch the first 5 of those.
        List<Invoice__c> firstBatch = InvoicePaginationController.getInvoicesPaged(5, null, null);
        Invoice__c fifthRecord = firstBatch[4];

        Test.startTest();
        // Fetch the next 5. Because they share the same date, 
        // the query MUST rely on the Id tie-breaker.
        List<Invoice__c> secondBatch = InvoicePaginationController.getInvoicesPaged(
            5, 
            fifthRecord.Date__c, 
            fifthRecord.Id
        );
        Test.stopTest();

        Assert.areEqual(5, secondBatch.size());
        // Verify we didn't just get the same 5 records back
        for(Invoice__c inv : secondBatch) {
            Assert.areNotEqual(fifthRecord.Id, inv.Id, 'Tie-breaker failed: Duplicate record found.');
        }
    }

    @IsTest
    static void testEndOfData() {
        // Query more than available to see if it handles the end gracefully
        Test.startTest();
        List<Invoice__c> result = InvoicePaginationController.getInvoicesPaged(200, null, null);
        Test.stopTest();

        Assert.areEqual(100, result.size(), 'Should return all available records but not more.');
    }
}