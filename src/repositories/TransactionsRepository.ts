import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const TransactionsHistory = await this.find();

    const { income, outcome } = TransactionsHistory.reduce(
      (accumulator, currentTransaction) => {
        switch (currentTransaction.type) {
          case 'income':
            accumulator.income += Number(currentTransaction.value);
            break;

          case 'outcome':
            accumulator.outcome += Number(currentTransaction.value);
            break;

          default:
            break;
        }

        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
