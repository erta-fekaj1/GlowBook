const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Service = require('../models/Service');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
});

describe('MongoDB connection', () => {
  it('should be connected via mongodb-memory-server', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});

describe('Service model', () => {
  it('should create and retrieve a service', async () => {
    const svc = await Service.create({
      id: 1,
      name: 'Test Manicure',
      desc: 'A test service',
      price: 25,
      duration: 45,
    });
    expect(svc.name).toBe('Test Manicure');
    expect(svc.price).toBe(25);

    const found = await Service.findOne({ id: 1 });
    expect(found).not.toBeNull();
    expect(found.name).toBe('Test Manicure');
  });
});

describe('User model', () => {
  it('should create a user with hashed password', async () => {
    const hash = await bcrypt.hash('secret123', 10);
    const user = await User.create({
      id: 1,
      name: 'Test Client',
      email: 'test@glowbook.com',
      password: hash,
      role: 'client',
    });
    expect(user.email).toBe('test@glowbook.com');
    expect(user.role).toBe('client');

    const valid = await bcrypt.compare('secret123', user.password);
    expect(valid).toBe(true);
  });
});
