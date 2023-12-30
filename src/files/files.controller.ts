import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Get,
  Delete,
  Param,
  NotFoundException,
  Body,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from '../firebase.service';
import { PrismaService } from '../prisma.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prismaService: PrismaService,
  ) { }

  @Post('')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { lang: string },
  ) {
    const uploadPromises = files.map(async (file) => {
      const url = await this.firebaseService.uploadFile(file);
      await this.prismaService.file.create({
        data: {
          url,
          fileType: this.categorizeFileType(file.mimetype),
          lang: body.lang,
        },
      });
    });

    await Promise.all(uploadPromises);
    return { message: 'Files uploaded successfully' };
  }
  @Get(':fileType') // fileType: img || vid || pdf
  async retrieveFilesByType(@Param('fileType') fileType: string, @Query('lang') lang: string) {
    return this.prismaService.file.findMany({
      where: { fileType, lang },
    });
  }
  @Get('count-downloads/:fileId')
  async countDownloads(@Param('fileId') id: string) {
    const file = await this.prismaService.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.prismaService.file.update({
      where: { id },
      data: { downloads: file.downloads + 1 },
    });

    return { message: 'Download counted successfully' };
  }
  @Get('count-downloads/all/:fileType') // fileType: img || vid || pdf
  async countDownloadsGet(@Param('fileType') fileType: string) {
    const file = await this.prismaService.file.aggregate({
      where: { fileType },
      _sum: {
        downloads: true,
      },
    });

    return { data: file };
  }
  @Get('count-impressions/count')
  async countImpressions() {
    const impression = await this.prismaService.impression.findFirst();

    if (!impression) {
    const impression = await this.prismaService.impression.create({
      data:{
        count: 1,
      }
    });
    return { message: 'count updated successfully' };
    }

    await this.prismaService.impression.update({
      where: { id: impression.id },
      data: { count: impression.count + 1 },
    });

    return { message: 'count updated successfully' };
  }
  @Get('count-impressions/counter')
  async countImpressionsGet() {
    const impression = await this.prismaService.impression.findFirst();

    if (!impression) {
      throw new NotFoundException('not found');
    }

    return { message: impression };
  }
  categorizeFileType(mimeType: string): string {
    if (mimeType.startsWith('video/')) {
      return 'vid';
    } else if (mimeType.startsWith('image/')) {
      return 'img';
    } else if (mimeType === 'application/pdf') {
      return 'pdf';
    } else {
      return 'other'; // You may want to handle other types as needed
    }
  }
  @Delete('')
  async clearFiles(
  ) {
    await this.prismaService.file.deleteMany();
    return { message: 'Files deleted successfully' };
  }
}
