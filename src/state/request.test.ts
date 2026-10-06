import { describe, expect, it } from 'vitest';
import { DEFAULT_REQUEST, isRequestDirty, requestReducer, type RequestState } from './request';

describe('requestReducer reset', () => {
  it('restores every default after both paths were filled in', () => {
    const filled: RequestState = {
      path: 'new',
      person: { id: 'user-1', fullName: 'Test Person', email: 'test@example.com', status: 'none' },
      roleId: 'role-1',
      roleName: 'Engineer',
      disciplineId: 'disc-1',
      disciplineName: 'Electrical',
      isCore: false,
      isFullTime: false,
      hasEgnyte: false,
      hasTeams: false,
      hasPowerPlatform: false,
      partTimeHours: 20,
      newProjects: [{ id: 'p1', number: '12345', isNda: true, isClosed: false }],
      existingProjects: [{ id: 'p2', number: '67890', isNda: false, isClosed: false }],
    };

    const result = requestReducer(filled, { type: 'reset' });

    expect(result).toEqual(DEFAULT_REQUEST);
    expect(result.isCore && result.isFullTime && result.hasEgnyte && result.hasTeams && result.hasPowerPlatform).toBe(true);
    expect(isRequestDirty(result)).toBe(false);
    expect(isRequestDirty(filled)).toBe(true);
  });
});
