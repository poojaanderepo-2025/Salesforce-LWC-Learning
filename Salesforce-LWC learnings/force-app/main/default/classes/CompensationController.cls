public with sharing class CompensationController {

    /**
     * DYNAMIC COLUMNS: Fetches table configuration from Custom Metadata.
     * Use cacheable=true for performance as this data changes rarely.
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getDynamicColumns(String department) {
        try {
            // Query metadata to find the configuration for this department
            List<Datatable_Config__mdt> configs = [
                SELECT Column_JSON__c 
                FROM Datatable_Config__mdt 
                WHERE Department__c = :department
                WITH USER_MODE 
                LIMIT 1
            ];

            if (configs.isEmpty()) {
                throw new AuraHandledException('No configuration found for department: ' + department);
            }

            // Deserialize the JSON string stored in Metadata into a List of Objects
            // Example JSON: [{"label":"Bonus","fieldName":"Bonus__c","type":"currency","editable":true}]
            return (List<Map<String, Object>>) JSON.deserializeUntyped(configs[0].Column_JSON__c);
            
        } catch (Exception e) {
            throw new AuraHandledException('Column Error: ' + e.getMessage());
        }
    }

    /**
     * UPDATE LOGIC: Handles bulk updates with Conflict Detection (Optimistic Locking).
     */
    @AuraEnabled
    public static void updateEmployeeBonuses(List<Map<String, Object>> draftValues) {
        if (draftValues == null || draftValues.isEmpty()) return;

        // 1. Collect IDs for bulk query
        Set<Id> employeeIds = new Set<Id>();
        for (Map<String, Object> draft : draftValues) {
            employeeIds.add((Id)draft.get('Id'));
        }

        // 2. Query DB to check LastModifiedDate/SystemModStamp
        Map<Id, Employee__c> dbRecords = new Map<Id, Employee__c>([
            SELECT Id, SystemModStamp 
            FROM Employee__c 
            WHERE Id IN :employeeIds 
            WITH USER_MODE
        ]);

        List<Employee__c> toUpdate = new List<Employee__c>();

        // 3. Compare Timestamps
        for (Map<String, Object> draft : draftValues) {
            Id recordId = (Id)draft.get('Id');
            Employee__c dbRecord = dbRecords.get(recordId);
            
            // Client passes the timestamp they had when they LOADED the page
            Long clientTime = (Long)draft.get('lastViewedTime'); 
            Long serverTime = dbRecord.SystemModStamp.getTime();

            if (serverTime > clientTime) {
                throw new AuraHandledException(
                    'Conflict detected for record ' + recordId + 
                    '. Another user has updated this record. Please refresh.'
                );
            }

            // 4. Map the updated fields (Dynamically)
            Employee__c emp = new Employee__c(Id = recordId);
            if (draft.containsKey('Bonus_Amount__c')) emp.Bonus_Amount__c = (Decimal)draft.get('Bonus_Amount__c');
            if (draft.containsKey('Performance_Rating__c')) emp.Performance_Rating__c = (String)draft.get('Performance_Rating__c');
            
            toUpdate.add(emp);
        }

        // 5. Secure DML
        try {
            Database.update(toUpdate, AccessLevel.USER_MODE);
        } catch (Exception e) {
            throw new AuraHandledException('Update failed: ' + e.getMessage());
        }
    }
}