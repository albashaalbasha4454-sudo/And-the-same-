# Security Specification - Sooq Alketab 2026

## Data Invariants
- An Invoice cannot be created without being linked to a valid User (processedBy).
- Financial Transactions must always have a positive amount.
- Products cannot have negative quantity (except for services which are 9999).
- Audit Logs are append-only. No updates or deletes allowed.
- Recycle Bin items are immutable once created; they can only be deleted (final deletion) or read (restoration).

## The "Dirty Dozen" Payloads

1. **Identity Theft**: Creating an invoice but setting `processedBy` to another user.
2. **Audit Tampering**: Attempting to delete an `auditLogs` entry.
3. **Price Manipulation**: Updating a product price as a `cashier` (if forbidden).
4. **Negative Expense**: Creating an `expense` with a negative amount.
5. **Unauthorized Account Access**: Transferring money from an account the user doesn't have access to.
6. **Self-Promotion**: A cashier trying to update their own `role` to 'admin'.
7. **Bypassing Recycle**: Deleting a product directly without creating a `recycleBin` entry (if enforced). Actually rules can't enforce a separate collection move, but they can restrict direct delete.
8. **Junk ID**: Using a 2KB string as a product ID.
9. **Orphaned Transaction**: Creating a transaction referencing a non-existent account.
10. **Time Travel**: Creating a sale with a `date` in the past or future.
11. **PII Leak**: A cashier listing all users' password hashes.
12. **System Reset Bypass**: Deleting the entire `products` collection without an approved `resetRequest`.

## Test Runner Plan
I will generate `firestore.rules` that address these.
