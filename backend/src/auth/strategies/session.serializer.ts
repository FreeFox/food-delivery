import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { ProfilesService } from '../../profiles/profiles.service';
import { AuthenticatedUser } from '../../common/types';

/**
 * Determines what gets stored in the session cookie (serialize)
 * and how to reconstruct req.user from the stored value (deserialize).
 *
 * We store only the profileId — a lightweight pointer — and hydrate the
 * full user object on each request so stale role/status data is never
 * served from a long-lived session.
 */
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly profilesService: ProfilesService) {
    super();
  }

  serializeUser(
    user: AuthenticatedUser,
    done: (err: Error | null, id: string) => void,
  ): void {
    done(null, user.id);
  }

  async deserializeUser(
    profileId: string,
    done: (err: Error | null, user: AuthenticatedUser | null) => void,
  ): Promise<void> {
    try {
      const profile = await this.profilesService.findPublicById(profileId);
      done(null, profile);
    } catch {
      // Profile deleted or deactivated — invalidate the session gracefully
      done(null, null);
    }
  }
}
