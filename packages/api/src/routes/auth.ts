import type { FastifyPluginAsync } from 'fastify';
import { getConnection } from '@patentrack/db';
import { createLogger } from '@patentrack/shared';
import bcrypt from 'bcrypt';
import { UserRole } from '@patentrack/core';

const logger = createLogger('auth-routes');

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: { email: string; password: string };
  }>('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const sql = getConnection();

    const [user] = await sql<
      Array<{
        id: string;
        email: string;
        password_hash: string;
        role: UserRole;
        tenant_id: string;
        is_active: boolean;
      }>
    >`SELECT id, email, password_hash, role, tenant_id, is_active FROM users WHERE email = ${email}`;

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return reply.code(403).send({ error: 'Account is inactive' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      },
    });
  });

  fastify.post<{
    Body: { email: string; password: string };
  }>('/admin/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const sql = getConnection();

    const [user] = await sql<
      Array<{
        id: string;
        email: string;
        password_hash: string;
        role: UserRole;
        tenant_id: string;
        is_active: boolean;
      }>
    >`SELECT id, email, password_hash, role, tenant_id, is_active FROM users WHERE email = ${email} AND role = 'ADMIN'`;

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return reply.code(403).send({ error: 'Account is inactive' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
    });

    logger.info('Admin logged in', { userId: user.id, email: user.email });

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      },
    });
  });

  fastify.post('/refresh', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { userId, email, role, tenantId } = request.user;

    const token = fastify.jwt.sign({
      userId,
      email,
      role,
      tenantId,
    });

    return reply.send({ token });
  });

  fastify.post('/logout', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    logger.info('User logged out', { userId: request.user.userId });
    return reply.send({ message: 'Logged out successfully' });
  });

  fastify.get('/profile', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;

    const sql = getConnection();

    const [user] = await sql<
      Array<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: UserRole;
        tenant_id: string;
        is_active: boolean;
        created_at: Date;
      }>
    >`SELECT id, email, first_name, last_name, role, tenant_id, is_active, created_at FROM users WHERE id = ${userId}`;

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
      isActive: user.is_active,
      createdAt: user.created_at,
    });
  });

  fastify.post<{
    Body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      tenantId: string;
    };
  }>('/register', async (request, reply) => {
    const { email, password, firstName, lastName, tenantId } = request.body;

    if (!email || !password || !firstName || !lastName || !tenantId) {
      return reply.code(400).send({ error: 'All fields are required' });
    }

    const sql = getConnection();

    const [existingUser] = await sql<
      Array<{ id: string }>
    >`SELECT id FROM users WHERE email = ${email}`;

    if (existingUser) {
      return reply.code(409).send({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await sql<
      Array<{ id: string }>
    >`INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role) 
      VALUES (${tenantId}, ${email}, ${passwordHash}, ${firstName}, ${lastName}, 'CUSTOMER_USER') 
      RETURNING id`;

    logger.info('User registered', { userId: newUser.id, email });

    const token = fastify.jwt.sign({
      userId: newUser.id,
      email,
      role: UserRole.CUSTOMER_USER,
      tenantId,
    });

    return reply.code(201).send({
      token,
      user: {
        id: newUser.id,
        email,
        role: UserRole.CUSTOMER_USER,
        tenantId,
      },
    });
  });
};
