import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, E2E, ORIGIN, testEmail, type TestApp } from './helpers';

describe.skipIf(!E2E)('auth: email code', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.redis.flushdb();
  });

  afterAll(async () => {
    await t.app.close();
  });

  const http = () => request(t.app.getHttpServer());

  async function signIn(email: string): Promise<string> {
    await http().post('/api/v1/auth/email/start').set('Origin', ORIGIN).send({ email }).expect(204);
    const res = await http()
      .post('/api/v1/auth/email/verify')
      .set('Origin', ORIGIN)
      .send({ email, code: t.mail.lastCodeFor(email) })
      .expect(200);
    const cookie = res.headers['set-cookie'] as unknown as string[];
    const session = cookie.find((c) => c.startsWith('ca_session='));
    if (!session) throw new Error('no session cookie');
    return session.split(';')[0] ?? '';
  }

  it('rejects state-changing requests without a trusted Origin', async () => {
    const res = await http()
      .post('/api/v1/auth/email/start')
      .send({ email: testEmail('origin') })
      .expect(403);
    expect(res.body.code).toBe('bad_origin');
  });

  it('signs up a new user, asks for a profile, then completes it', async () => {
    const email = testEmail('new');
    const cookie = await signIn(email);

    const me = await http().get('/api/v1/me').set('Cookie', cookie).expect(200);
    expect(me.body).toMatchObject({ email, needsProfile: true, username: null, role: 'user' });

    const username = `u${Date.now().toString(36)}`;
    const done = await http()
      .post('/api/v1/auth/complete-profile')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .send({ username: username.toUpperCase(), name: 'Тест' })
      .expect(200);
    expect(done.body).toMatchObject({ username, name: 'Тест', needsProfile: false });
  });

  it('rejects a taken or reserved username', async () => {
    const first = await signIn(testEmail('a'));
    const username = `taken${Date.now().toString(36)}`;
    await http()
      .post('/api/v1/auth/complete-profile')
      .set('Origin', ORIGIN)
      .set('Cookie', first)
      .send({ username, name: 'A' })
      .expect(200);

    const second = await signIn(testEmail('b'));
    const taken = await http()
      .post('/api/v1/auth/complete-profile')
      .set('Origin', ORIGIN)
      .set('Cookie', second)
      .send({ username, name: 'B' })
      .expect(409);
    expect(taken.body.code).toBe('username_taken');

    const reserved = await http()
      .post('/api/v1/auth/complete-profile')
      .set('Origin', ORIGIN)
      .set('Cookie', second)
      .send({ username: 'support_team', name: 'B' })
      .expect(422);
    expect(reserved.body.errors[0]).toEqual({ field: 'username', code: 'username_reserved' });
  });

  it('counts wrong codes and locks after five attempts', async () => {
    const email = testEmail('wrong');
    await http().post('/api/v1/auth/email/start').set('Origin', ORIGIN).send({ email }).expect(204);
    const right = t.mail.lastCodeFor(email);
    const wrong = right === '000000' ? '111111' : '000000';

    const first = await http()
      .post('/api/v1/auth/email/verify')
      .set('Origin', ORIGIN)
      .send({ email, code: wrong })
      .expect(422);
    expect(first.body).toMatchObject({
      code: 'otp_invalid',
      errors: [{ field: 'code', code: 'attempts_left:4' }],
    });

    for (let i = 0; i < 4; i += 1) {
      await http()
        .post('/api/v1/auth/email/verify')
        .set('Origin', ORIGIN)
        .send({ email, code: wrong });
    }
    const locked = await http()
      .post('/api/v1/auth/email/verify')
      .set('Origin', ORIGIN)
      .send({ email, code: right })
      .expect(429);
    expect(locked.body.code).toBe('otp_too_many_attempts');
  });

  it('enforces the resend cooldown', async () => {
    const email = testEmail('cooldown');
    await http().post('/api/v1/auth/email/start').set('Origin', ORIGIN).send({ email }).expect(204);
    const res = await http()
      .post('/api/v1/auth/email/start')
      .set('Origin', ORIGIN)
      .send({ email })
      .expect(429);
    expect(res.body.code).toBe('otp_resend_too_soon');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('reactivates a deactivated account on sign-in and blocks a banned one', async () => {
    const email = testEmail('status');
    await signIn(email);
    await t.prisma.user.update({ where: { email }, data: { status: 'deactivated' } });
    await t.redis.flushdb();
    await signIn(email);
    expect((await t.prisma.user.findUniqueOrThrow({ where: { email } })).status).toBe('active');

    await t.prisma.user.update({ where: { email }, data: { status: 'banned', bannedUntil: null } });
    await t.redis.flushdb();
    await http().post('/api/v1/auth/email/start').set('Origin', ORIGIN).send({ email }).expect(204);
    const res = await http()
      .post('/api/v1/auth/email/verify')
      .set('Origin', ORIGIN)
      .send({ email, code: t.mail.lastCodeFor(email) })
      .expect(403);
    expect(res.body.code).toBe('user_banned');
  });

  it('logs out and invalidates the session', async () => {
    const cookie = await signIn(testEmail('logout'));
    await http()
      .post('/api/v1/auth/logout')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .expect(204);
    await http().get('/api/v1/me').set('Cookie', cookie).expect(401);
  });
});
