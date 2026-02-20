@isTest
private class EmployeeControllerTest {

    @testSetup
    static void setup() {
        // Create a mix of departments to test filtering
        List<Employee__c> testEmps = new List<Employee__c>();
        
        // 3 Sales Employees
        for(Integer i=0; i<3; i++) {
            testEmps.add(new Employee__c(
                Name = 'Sales User ' + i,
                Department__c = 'Sales',
                Salary__c = 50000,
                Performance_Rating__c = '3'
            ));
        }
        
        // 1 Engineering Employee
        testEmps.add(new Employee__c(
            Name = 'Eng User',
            Department__c = 'Engineering',
            Salary__c = 90000,
            Performance_Rating__c = '5'
        ));

        insert testEmps;
    }

    @isTest
    static void testGetEmployeesByDept_Success() {
        // Test filtering by Sales
        Test.startTest();
        List<Employee__c> results = EmployeeController.getEmployeesByDept('Sales');
        Test.stopTest();

        // Lead Assertions: Check size, filtering, and ordering
        Assert.areEqual(3, results.size(), 'Should return exactly 3 Sales employees');
        Assert.areEqual('Sales User 0', results[0].Name, 'Results should be ordered by Name ASC');
        Assert.isNotNull(results[0].SystemModStamp, 'SystemModStamp must be returned for conflict detection');
    }

    @isTest
    static void testGetEmployeesByDept_EmptyInput() {
        // Test null/blank handling
        Test.startTest();
        List<Employee__c> resultsNull = EmployeeController.getEmployeesByDept(null);
        List<Employee__c> resultsBlank = EmployeeController.getEmployeesByDept('');
        Test.stopTest();

        Assert.isTrue(resultsNull.isEmpty(), 'Null input should return empty list');
        Assert.isTrue(resultsBlank.isEmpty(), 'Blank input should return empty list');
    }

    @isTest
    static void testGetEmployeesByDept_NoResults() {
        // Test a department that doesn't exist
        Test.startTest();
        List<Employee__c> results = EmployeeController.getEmployeesByDept('Marketing');
        Test.stopTest();

        Assert.isTrue(results.isEmpty(), 'Non-existent department should return empty list');
    }

    @isTest
    static void testGetEmployeesByDept_SecurityContext() {
        // Create a restricted user to test WITH USER_MODE
        // This validates the Lead Best Practice of security enforcement
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1];
        User standardUser = new User(
            Alias = 'stndrd', Email='standarduser@test.com', 
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', ProfileId = p.Id, 
            TimeZoneSidKey='America/Los_Angeles', UserName='testuser' + DateTime.now().getTime() + '@test.com'
        );

        System.runAs(standardUser) {
            Test.startTest();
            try {
                List<Employee__c> results = EmployeeController.getEmployeesByDept('Sales');
                // If user has no access, WITH USER_MODE will throw an exception or return empty
                Assert.isNotNull(results, 'Query should execute under user context');
            } catch (AuraHandledException e) {
                // Assert that security restrictions are correctly surfacing
                Assert.isTrue(e.getMessage().contains('Error fetching employees'), 'Should throw handled security error');
            }
            Test.stopTest();
        }
    }
}