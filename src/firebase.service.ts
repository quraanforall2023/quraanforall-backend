import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { Bucket } from '@google-cloud/storage';

@Injectable()
export class FirebaseService {
  private readonly bucket: Bucket;

  constructor() {
    admin.initializeApp({
      // Add your Firebase config here
      credential: admin.credential.cert({
        projectId: 'your-project-id',
        clientEmail: 'your-client-email',
        privateKey: 'your-private-key',
      }),
      storageBucket: 'your-storage-bucket-url',
    });

    this.bucket = admin.storage().bucket();
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = this.generateFileName(file.originalname);
    const filePath = this.getTempFilePath(fileName);

    return new Promise<string>((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, async (writeErr) => {
        if (writeErr) {
          reject('Error writing file to temp storage');
          return;
        }

        try {
          const uploadResponse = await this.bucket.upload(filePath, {
            destination: fileName,
          });

          const url = await uploadResponse[0].getSignedUrl({
            action: 'read',
            expires: '01-01-2030', // Set an appropriate expiration date
          });

          resolve(url[0]);
        } catch (uploadErr) {
          reject('Error uploading file to Firebase storage');
        } finally {
          // Cleanup temp file
          fs.unlinkSync(filePath);
        }
      });
    });
  }

  private generateFileName(originalName: string): string {
    const fileExtension = path.extname(originalName);
    const fileName = `${Date.now()}_${Math.floor(
      Math.random() * 10000,
    )}${fileExtension}`;
    return fileName;
  }

  private getTempFilePath(fileName: string): string {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileName);
    return tempFilePath;
  }
}
