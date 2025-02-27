"""
Database migrations package.

This package contains the database migration scripts using Alembic for the
Interaction Management System. It implements a forward-only migration strategy
for evolving the database schema over time.

The migration framework supports:
- Schema changes through incremental migrations
- Data migrations via separate migration scripts
- Two-phase constraint changes to maintain data integrity
- Zero-downtime patterns for critical changes
"""

__version__ = "0.1.0"