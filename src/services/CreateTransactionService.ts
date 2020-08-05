// import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';

import CategoriesRepository from '../repositories/CategoriesRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;

  type: 'income' | 'outcome';

  value: number;

  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    [title, value, type, category].forEach(arg => {
      if (!arg)
        throw new AppError(
          `Missing arguments. To create a transaction provide: title, value, type, category`,
        );
    });

    if (type !== 'income' && type !== 'outcome')
      throw new AppError('Transaction type is invalid!');

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total)
      throw new AppError('Insufficient balance for this transaction');

    const categoriesRepository = getCustomRepository(CategoriesRepository);
    const dbCategory = await categoriesRepository.getCategory(category);

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: dbCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
