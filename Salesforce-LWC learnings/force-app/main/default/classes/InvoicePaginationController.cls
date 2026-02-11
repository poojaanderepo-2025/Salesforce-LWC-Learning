public with sharing class InvoicePaginationController {
    
    /**
     * @description Fetches invoices using the Seek Method (Keyset Pagination).
     * This avoids the 2,000 row OFFSET limit and performs better on large datasets.
     * @param pageSize Number of records to return.
     * @param lastDate The Date__c value of the last record in the current list.
     * @param lastId The Id of the last record in the current list (Tie-breaker).
     */
    @AuraEnabled(cacheable=true)
    public static List<Invoice__c> getInvoicesPaged(Integer pageSize, Date lastDate, Id lastId) {
        try {
            // 1. Establish Lead-level defaults
            Integer limitVal = (pageSize == null || pageSize <= 0) ? 50 : pageSize;
            
            // 2. Build the Dynamic SOQL
            // We use Date__c and Id to ensure a unique, stable sort order.
            String query = 'SELECT Id, Name, Amount__c, Status__c, Date__c ' +
                           'FROM Invoice__c ';
            
            // 3. The Seek Logic
            // If it's the first page, lastDate and lastId are null.
            // If it's subsequent pages, we filter for records "older" than our last seen record.
            if (lastDate != null && lastId != null) {
                query += 'WHERE (Date__c < :lastDate) OR (Date__c = :lastDate AND Id < :lastId) ';
            }
            
            query += 'ORDER BY Date__c DESC, Id DESC LIMIT :limitVal';

            // 4. Use Bind Variables (Lead Best Practice for Security & Performance)
            Map<String, Object> queryBinds = new Map<String, Object>{
                'lastDate' => lastDate,
                'lastId' => lastId,
                'limitVal' => limitVal
            };

            // 5. Execute with User Mode for FLS/Sharing enforcement
            return Database.queryWithBinds(
                query, 
                queryBinds, 
                AccessLevel.USER_MODE
            );

        } catch (Exception e) {
            // Log properly and throw AuraHandledException for LWC visibility
            throw new AuraHandledException('Database error: ' + e.getMessage());
        }
    }
}