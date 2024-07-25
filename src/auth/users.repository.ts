import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  private logger = new Logger('UsersRepository', true);

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;

    // hash
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({ username, password: hashedPassword });

    try {
      await this.save(user);
    } catch (error) {
      // duplicate username
      if (error.code === '23505') {
        this.logger.error(
          `Failed to create user "${username}". Username already exists`,
          error.stack,
        );
        throw new ConflictException('Username already exists');
      } else {
        this.logger.error(`Failed to create user "${username}".`, error.stack);
        throw new InternalServerErrorException();
      }
    }
  }
}
