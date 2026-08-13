# CS Fundamentals — Database Management Systems

## Core Concepts
- **ACID properties**: Atomicity, Consistency, Isolation, Durability
- **Normalization**: 1NF, 2NF, 3NF, BCNF — when and why to normalize
- **Denormalization**: When performance trumps normalization
- **ER Model**: Entities, attributes, relationships, cardinality

## SQL Essentials
- DDL, DML, DCL, TCL commands
- JOINs: INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF
- Subqueries: Correlated vs non-correlated
- GROUP BY, HAVING, ORDER BY
- Window functions: ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG
- Indexing: B-Tree, Hash, Composite, Covering indexes
- Views, Stored Procedures, Triggers

## Transactions & Concurrency
- Transaction isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable
- Concurrency problems: Dirty reads, Non-repeatable reads, Phantom reads
- Locking: Shared, Exclusive, Deadlock detection and prevention
- MVCC (Multi-Version Concurrency Control)

## SQL vs NoSQL
- When to use relational vs document vs key-value vs graph databases
- CAP theorem and its practical implications
- MongoDB, Cassandra, Redis, Neo4j — use cases

## Interview Questions
- What is normalization? Explain with examples up to 3NF
- Write a query to find the second highest salary
- Explain the difference between WHERE and HAVING
- What is an index? How does it improve query performance?
- Explain ACID properties with real examples
- Difference between DELETE, TRUNCATE, and DROP
