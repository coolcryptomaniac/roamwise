# Follow-up after PRs 723/724
This PR adds an atomic **single-use claim primitive** only; it is not yet wired to live orders or budgets. A successful Firestore create-if-absent is atomic and prevents two claimants with the same key from winning. A claim cannot safely be reset on a timeout without provider-side order reconciliation.

## Integration gate
1. Qikink: claim once with a stable order ID before POST, persist provider order reference, reconcile unknown responses via supplier dashboard, then close order. Do not automatically clear claims on timeout. Never issue duplicate external submissions.
2. Wallet: replace KV authoritative read/modify/write with transactional Firestore per-account balance+append-only journals. Reconcile old wallet lots against original Cashfree transactions before migration. Do not enable wallet spending based only on a claim.
3. Budget: one **atomic** daily IST aggregate counter/transaction for all vendors. The pure expenseDecision function is not sufficient by itself. Default to no spend when the budget service is unavailable.
4. Refunds: avoid treating wallet credit as completed bank refund; verify provider refund settlement.
5. Run tests and inspect deployment routing; do not activate these changes without end-to-end testing and owner approval.
