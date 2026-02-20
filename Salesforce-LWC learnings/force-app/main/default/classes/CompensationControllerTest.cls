@isTest
private class CompensationControllerTest {

    @testSetup
    static void setup() {
        // Create Test Employees
        List<Employee__c> emps = new List<Employee__c>();
        for(Integer i=0; i<5; i++) {
            emps.add(new Employee__c(
                Name = 'Test Employee ' + i,
                Bonus_Amount__c = 1000,
                Performance_Rating__c = 'Meets Expectations'
            ));
        }
        insert emps;
    }

    /**
     * Test getDynamicColumns
     * Note: This assumes a record exists in your org's metadata. 
     * In a real CI/CD, you'd package the metadata with the code.
     */
    @isTest
    static void testGetDynamicColumnsSuccess() {
        Test.startTest();
        // Replace 'Sales' with a valid department from your metadata
        List<Map<String, Object>> columns = CompensationController.getDynamicColumns('Sales');
        Test.stopTest();

        Assert.isNotNull(columns, 'Columns should be returned from metadata');
        Assert.isFalse(columns.isEmpty(), 'Column list should not be empty');
    }

    /**
     * Test updateEmployeeBonuses - Positive Scenario
     */
    @isTest
    static void testUpdateEmployeeBonusesSuccess() {
        Employee__c emp = [SELECT Id, SystemModStamp FROM Employee__c LIMIT 1];
        
        // Prepare the draft values map mirroring the LWC structure
        List<Map<String, Object>> draftValues = new List<Map<String, Object>>();
        Map<String, Object> draft = new Map<String, Object>();
        draft.put('Id', emp.Id);
        draft.put('Bonus_Amount__c', 5000);
        draft.put('Performance_Rating__c', 'Exceeds Expectations');
        draft.put('lastViewedTime', emp.SystemModStamp.getTime());
        draftValues.add(draft);

        Test.startTest();
        CompensationController.updateEmployeeBonuses(draftValues);
        Test.stopTest();

        Employee__c updatedEmp = [SELECT Bonus_Amount__c FROM Employee__c WHERE Id = :emp.Id];
        Assert.areEqual(5000, updatedEmp.Bonus_Amount__c, 'Bonus should have been updated');
    }

    /**
     * Test updateEmployeeBonuses - Conflict Detection (Negative Scenario)
     */
    @isTest
    static void testUpdateEmployeeBonusesConflict() {
        Employee__c emp = [SELECT Id, SystemModStamp FROM Employee__c LIMIT 1];
        
        // Simulate an "Old" timestamp (The record was updated after this)
        Long oldTimestamp = emp.SystemModStamp.getTime() - 10000; 

        List<Map<String, Object>> draftValues = new List<Map<String, Object>>();
        Map<String, Object> draft = new Map<String, Object>();
        draft.put('Id', emp.Id);
        draft.put('lastViewedTime', oldTimestamp);
        draftValues.add(draft);

        String errorMessage;
        Test.startTest();
        try {
            CompensationController.updateEmployeeBonuses(draftValues);
        } catch (AuraHandledException e) {
            errorMessage = e.getMessage();
        }
        Test.stopTest();

        Assert.isNotNull(errorMessage, 'An exception should have been thrown');
        Assert.isTrue(errorMessage.contains('Conflict detected'), 'Error message should mention conflict');
    }
}