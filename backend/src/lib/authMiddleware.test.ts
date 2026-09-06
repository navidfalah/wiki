import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAdmin, requireAuth } from './authMiddleware';
import { getSessionUser } from './sessions';

vi.mock('./sessions', () => ({
  getSessionUser: vi.fn(),
}));

function mockReq(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const sessionUser = { id: 'u1', username: 'alice', role: 'user' as const };

describe('requireAuth', () => {
  beforeEach(() => {
    vi.mocked(getSessionUser).mockReset();
  });

  it('rejects with 401 when there is no Authorization header', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(getSessionUser).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the Authorization header is not a Bearer token', () => {
    const req = mockReq('Basic abc123');
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(getSessionUser).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the session token is unknown or expired', () => {
    vi.mocked(getSessionUser).mockReturnValue(null);
    const req = mockReq('Bearer some-token');
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(getSessionUser).toHaveBeenCalledWith('some-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('strips the "Bearer " prefix and trims whitespace before looking up the session', () => {
    vi.mocked(getSessionUser).mockReturnValue(sessionUser);
    const req = mockReq('Bearer   some-token  ');
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(getSessionUser).toHaveBeenCalledWith('some-token');
  });

  it('attaches req.user and calls next() for a valid session', () => {
    vi.mocked(getSessionUser).mockReturnValue(sessionUser);
    const req = mockReq('Bearer valid-token');
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(req.user).toEqual(sessionUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('requireAdmin', () => {
  it('rejects with 403 when req.user is not set', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 403 when req.user.role is "user"', () => {
    const req = mockReq();
    req.user = sessionUser;
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when req.user.role is "admin"', () => {
    const req = mockReq();
    req.user = { id: 'u2', username: 'bob', role: 'admin' };
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
