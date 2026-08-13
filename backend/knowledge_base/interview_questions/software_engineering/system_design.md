# System Design — Interview Questions

## Fundamentals
- Scalability: horizontal vs vertical scaling
- Load balancing: Round Robin, Least Connections, Consistent Hashing
- Caching: Redis, Memcached, CDN, Cache invalidation strategies
- Database: SQL vs NoSQL, Sharding, Replication, CAP theorem
- Message Queues: Kafka, RabbitMQ, SQS — async communication patterns
- Microservices vs Monolith: tradeoffs, communication patterns
- API Design: REST, GraphQL, gRPC — when to use each

## Classic System Design Problems
- Design a URL shortener (TinyURL)
- Design a social media feed (Twitter/Instagram)
- Design a chat system (WhatsApp/Slack)
- Design a file storage system (Google Drive/Dropbox)
- Design a video streaming platform (YouTube/Netflix)
- Design a ride-sharing service (Uber/Lyft)
- Design a search engine (Google)
- Design an e-commerce platform (Amazon)
- Design a notification system
- Design a rate limiter

## Key Concepts
- Consistent Hashing for distributed systems
- Leader Election and Consensus (Raft, Paxos)
- Event-Driven Architecture and CQRS
- Database indexing: B-Tree, Hash, Full-text
- Data partitioning strategies
- Distributed transactions (2PC, Saga pattern)
- Observability: Logging, Metrics, Tracing

## How to Approach System Design Interviews
1. Clarify requirements (functional + non-functional)
2. Estimate scale (users, QPS, storage)
3. Define API contracts
4. High-level architecture diagram
5. Deep dive into critical components
6. Address bottlenecks and failure scenarios
7. Discuss monitoring and alerting
