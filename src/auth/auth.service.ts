import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../resources/users/users.service'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email().optional(),
  cpf: z.string().optional(),
  password: z.string().min(6)
}).refine(d => !!d.email || !!d.cpf, { message: 'email or cpf required' })

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService
  ) {}

  async login(body: unknown) {
    const data = loginSchema.parse(body)
    const user = data.email ? await this.users.findByEmail(data.email) : await this.users.findByCpf(data.cpf!)
    if (!user) throw new UnauthorizedException()
    const ok = await this.users.validatePassword(user.passwordHash, data.password)
    if (!ok || user.active === false) throw new UnauthorizedException()
    const payload = { sub: user.id, company_id: user.companyId, role: user.role }
    const accessToken = await this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET!, expiresIn: process.env.JWT_EXPIRES_IN || '15m' })
    const refreshToken = await this.jwt.signAsync(payload, { secret: process.env.REFRESH_SECRET!, expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' })
    return { access_token: accessToken, refresh_token: refreshToken }
  }

  async refresh(token: string) {
    try {
      const decoded = await this.jwt.verifyAsync(token, { secret: process.env.REFRESH_SECRET! })
      const payload = { sub: decoded.sub, company_id: decoded.company_id, role: decoded.role }
      const accessToken = await this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET!, expiresIn: process.env.JWT_EXPIRES_IN || '15m' })
      return { access_token: accessToken }
    } catch {
      throw new UnauthorizedException()
    }
  }

  async me(user: any) {
    return user
  }
}
