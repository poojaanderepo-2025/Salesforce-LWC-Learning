public with sharing class EmployeeController {
    
    @AuraEnabled(cacheable=true)
    public static List<Employee__c> getEmployeesByDept(String department) {
        try {
            // Validate input
            if (String.isBlank(department)) {
                return new List<Employee__c>();
            }

            // Lead Best Practice: Using WITH USER_MODE to enforce FLS/Sharing
            // We include SystemModStamp for the conflict detection logic in JS
            return [
                SELECT Id, Name, Salary__c, Bonus_Amount__c, 
                       Performance_Rating__c, Department__c, SystemModStamp 
                FROM Employee__c 
                WHERE Department__c = :department
                WITH USER_MODE
                ORDER BY Name ASC
            ];
        } catch (Exception e) {
            // Throwing a handled exception ensures a readable message in the LWC
            throw new AuraHandledException('Error fetching employees: ' + e.getMessage());
        }
    }
}