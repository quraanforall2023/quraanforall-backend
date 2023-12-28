import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FirebaseService } from 'src/firebase.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [FilesController],
  providers: [FirebaseService, PrismaService],
})
export class FilesModule {}
