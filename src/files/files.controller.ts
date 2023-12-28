import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from '../firebase.service';
import { PrismaService } from '../prisma.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post('')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadPromises = files.map(async (file) => {
      const url = await this.firebaseService.uploadFile(file);
      await this.prismaService.file.create({
        data: { url, fileType: file.mimetype },
      });
    });

    await Promise.all(uploadPromises);
    return { message: 'Files uploaded successfully' };
  }
  @Get(':fileType')
  async retrieveFilesByType(@Param('fileType') fileType: string) {
    return this.prismaService.file.findMany({
      where: { fileType },
    });
  }
  @Get('count-downloads/:fileId')
  async countDownloads(@Param('fileId') fileId: string) {
    const file = await this.prismaService.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.prismaService.file.update({
      where: { id: fileId },
      data: { downloads: file.downloads + 1 },
    });

    return { message: 'Download counted successfully' };
  }
  @Get('count-impressions/count')
  async countImpressions() {
    const impression = await this.prismaService.impression.findFirst();

    if (!impression) {
      throw new NotFoundException('File not found');
    }

    await this.prismaService.file.update({
      where: { id: impression.id },
      data: { downloads: impression.count + 1 },
    });

    return { message: 'Download counted successfully' };
  }
}
