import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private firebaseApp: admin.app.App;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      this.firebaseApp = admin.apps[0] as admin.app.App;
    }
  }

  async validateToken(token: string): Promise<{ id: string; firebaseUid: string }> {
    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(token);
      const user = await this.usersService.findOrCreate(decodedToken.uid, {
        displayName: decodedToken.name || undefined,
        email: decodedToken.email || undefined,
        avatarUrl: decodedToken.picture || undefined,
      });
      return { id: user.id, firebaseUid: user.firebaseUid };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}