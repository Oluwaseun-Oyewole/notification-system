import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DuplicateResourceException,
  ResourceNotFoundException,
} from 'src/shared/exceptions/domain.exceptions';
import { hashPassword } from 'src/shared/utils/index.utils';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto, LoginDto } from './dto/user.dto';
import { User } from './entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(
    input: CreateUserDto,
    manager?: EntityManager,
  ): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;

    const userExists = await repo.findOneBy({ email: input.email });
    if (userExists) throw new DuplicateResourceException('User', input.email);

    const hashedPassword = await hashPassword(input.password);
    const user = repo.create({ ...input, password: hashedPassword });
    return repo.save(user);
  }

  async activateUser(input: Partial<LoginDto>) {
    const { email } = input;
    const userExists = await this.userRepository.findOne({
      where: { email },
    });
    if (!userExists) throw new ResourceNotFoundException('User', email);

    await this.userRepository.update(
      { id: userExists.id },
      {
        activatedAt: new Date(),
      },
    );
    return await this.userRepository.findOne({
      where: { id: userExists.id },
    });
  }

  async findUserWithPassword(email: string) {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }
  async findUserByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }

  async updateLoginTimestamp(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new ResourceNotFoundException('User', userId);

    await this.userRepository.update(
      { id: userId },
      {
        lastLoginDate: new Date(),
      },
    );
  }
}
