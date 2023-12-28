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
        projectId: 'quranforall-d9daf',
        clientEmail:
          'firebase-adminsdk-g07j1@quranforall-d9daf.iam.gserviceaccount.com',
        privateKey:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHCawhllewIPiN\nUcmDFanXBpoXkQ+vkGcvlZeeV9qyz0EiBoD9STURz3dORRKqTru915A0Wkzkn2mv\nOMAZSOWkxi/bC+KVfrEJGhliMVR1qfXkkMSRxMm8oEJsUNTl3IxrEqGJLD4Thc37\njSBBAxp6TqNEXyDA4uzNWLJ3T+8EIbjykrPIOra6hPVOtpdbLByu2nna8+4NrQK+\nI8YozFR4jcaAXVco77sUWiGU/x4XZJixdxHPH2zbu+50ZI/ZbSMAzmaYzcLCoM0Z\nBgG8WMs9n7QMgyM9J6pKlIMNbumxj3l25lMccJxFzazVVLe461/sXTh+s2vqMJOG\n5C/v2UbBAgMBAAECggEATi3gbLju7IGm32t2qYSC17ECKauS67TesvQhP9LmVkHO\nJZ1EYTi2Ha7N//JlqHuQhrr7K3UkqtBq5KZ33faiLRyjg3ihoXLH+vlDayxRLn55\n1TN/4nnXe72/GWiOl1MP3KbOyGCWaXivNdVzC9Y6OjxVKO/sn5cCyI3EW9UL3yTl\nIGxSoH8VrlOoUd22AYD/WQJAzc6VPM/kFuP8whefNg5CA+3zJLXje2hR1Q98v+Ko\nIaqSJItHAFO/KeWkQwDKqHocPZ7cI+PgSuZemQT1H+QlwiP4x9bMvhZYW9Uqr+d1\nVi6yAAeUyogta0lZwSQ7qwThS12ryFNLk6IyV2NVOQKBgQD/XJenCmz5aAEF9k9L\nzyL/rOOOkuPbHZ18lDnz7zZ/v2P3DPcyVwMwrUS4YNCAXs/D+jzQjGbPb6Kn1+Oi\nGwE1/3nj9visPJJoyB7dHqhm/gRfa7CXzBvCYaZhtE1oTB5BM5s7uXp5mUzoZEOu\n3MRUu0V+0Ud7/WSXmdLRY9rMTwKBgQDHiQm3yNNOkAVUqwZfvirgpHeWVQReU1vK\nwWRxzIvab1F4O5Gr8aND4YGtkiC3ERORWKAScvqxZTq3JpHabK83R8+9VEqeUqlA\nRKoG7UCM7y4erz7BWDBHQI2kGeLtaAvempGjYf20iyiEcSiIqockf7YLQy5oMqiU\n2Thfi6On7wKBgDinhk3dFkhPNsrn1rfvAMjQxru/AyZ9747QI/tmuySkhb0t9zoH\n7AFEr9ZoRFn2rwm/3vY18CldjyzFzQ8OBrrAL37QMGOmHKV6oL5WKu6OtNGmxssm\n0ZHSsGNE6VeWa6/zjyE1CWMpC9MTS6DkAfr6gXSdYcq0cTjhO9CQ4t4pAoGALi/Y\nYgRIdUz9DuYvqYXZYvpu/Atd4X+mJb6yQ203ii5uS0hupcBfLF1MqSLEE9wODXzY\nQK0AvoNSHgb9h/PUcxVaTtbuFsvHharfOI8+e+D5afzip9qEAlo87xlW3+FPrg1V\nXN5X3azAijevTEM82QP+3YiFe3UOdLX7SJKIJV0CgYEAuj3VN/pvq5b9UaGLxBQS\nqCPHPKxel3Ymx9uyEIVukEb6lLrG73s3Mdg5EZxjMuq1xBjLbGg8i5tSaw0PbQUI\nIpzciedTdMaKOSQPHfcMmpM/kYINZASpgbwTuTPkop6JeR0yMxEyo7VJZ1IvD9B3\nfboGc7v7/6yUKxbMbBga15k=\n-----END PRIVATE KEY-----\n',
      }),
      storageBucket: 'quranforall-d9daf.appspot.com',
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
            expires: '01-01-2050', // Set an appropriate expiration date
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
