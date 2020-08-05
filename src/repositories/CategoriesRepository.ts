import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async getCategory(title: string): Promise<Category> {
    const categoryExists = await this.findOne({ where: { title } });

    if (!categoryExists) {
      const category = await this.create({ title });
      await this.save(category);

      return this.getCategory(title);
    }

    return categoryExists;
  }
}

export default CategoriesRepository;
