import fs from 'fs';
import { In, getCustomRepository } from 'typeorm';

import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';

import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;

  type: 'income' | 'outcome';

  value: number;

  category: string;
}

class ImportTransactionsService {
  async execute(importedFilePath: string): Promise<Transaction[]> {
    const importReadStream = fs.createReadStream(importedFilePath);

    const parsers = csvParse({
      from_line: 2,
      relax_column_count: true,
    });

    const parseCSV = importReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoriesRepository = getCustomRepository(CategoriesRepository);
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const transactionsRepository = getCustomRepository(TransactionRepository);

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(importedFilePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
