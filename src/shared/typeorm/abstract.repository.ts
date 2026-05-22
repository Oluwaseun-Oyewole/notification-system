import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

export abstract class AbstractRepository<TEntity> {
  constructor(protected readonly repository: Repository<TEntity>) {}

  async findOne(
    where: FindOptionsWhere<TEntity>,
    options?: Omit<FindOneOptions<TEntity>, 'where'>,
  ): Promise<TEntity | null> {
    return this.repository.findOne({ where, ...options });
  }

  async find(options?: FindManyOptions<TEntity>): Promise<TEntity[]> {
    return this.repository.find(options);
  }

  async count(where?: FindOptionsWhere<TEntity>): Promise<number> {
    return this.repository.count({ where });
  }

  async create(createData: DeepPartial<TEntity>): Promise<TEntity> {
    const entity = this.repository.create(createData);
    return this.repository.save(entity);
  }

  async createMany(createData: DeepPartial<TEntity>[]): Promise<TEntity[]> {
    const entities = this.repository.create(createData);
    return this.repository.save(entities);
  }

  async update(
    where: FindOptionsWhere<TEntity>,
    updateData: DeepPartial<TEntity>,
  ): Promise<TEntity | null> {
    const entity = await this.repository.findOne({ where });
    if (!entity) return null;
    const merged = this.repository.merge(entity, updateData);
    return this.repository.save(merged);
  }

  async updateById(
    id: number | string,
    updateData: DeepPartial<TEntity>,
  ): Promise<TEntity | null> {
    await this.repository.update(id, updateData as any);
    return this.repository.findOne({ where: { id } as any });
  }

  async updateMany(
    where: FindOptionsWhere<TEntity>,
    updateData: DeepPartial<TEntity>,
  ): Promise<boolean> {
    const result = await this.repository.update(where, updateData as any);
    return (result.affected ?? 0) >= 1;
  }

  async delete(id: number | string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) >= 1;
  }

  async deleteMany(where: FindOptionsWhere<TEntity>): Promise<boolean> {
    const result = await this.repository.delete(where);
    return (result.affected ?? 0) >= 1;
  }

  async findOneAndDelete(
    where: FindOptionsWhere<TEntity>,
  ): Promise<TEntity | null> {
    const entity = await this.repository.findOne({ where });
    if (!entity) return null;
    await this.repository.remove(entity);
    return entity;
  }
}
