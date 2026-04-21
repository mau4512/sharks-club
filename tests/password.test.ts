import { hashPassword, isBcryptHash, verifyPassword } from '@/lib/password'

describe('password utils', () => {
  it('detects bcrypt hashes correctly', async () => {
    const hashed = await hashPassword('admin123')

    expect(isBcryptHash(hashed)).toBe(true)
    expect(isBcryptHash('admin123')).toBe(false)
    expect(isBcryptHash(null)).toBe(false)
  })

  it('verifies legacy plain text passwords', async () => {
    await expect(verifyPassword('admin', 'admin')).resolves.toBe(true)
    await expect(verifyPassword('admin', 'otro')).resolves.toBe(false)
  })

  it('verifies bcrypt passwords', async () => {
    const hashed = await hashPassword('segura123')

    await expect(verifyPassword('segura123', hashed)).resolves.toBe(true)
    await expect(verifyPassword('incorrecta', hashed)).resolves.toBe(false)
  })
})
