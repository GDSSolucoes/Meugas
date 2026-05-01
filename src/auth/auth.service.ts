import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../resources/users/users.service'


@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService
  ) {}

  async login(data: { email?: string, cpf?: string, password: string }) {
    const user = data.email ? await this.users.findByEmail(data.email) : await this.users.findByCpf(data.cpf!)
    if (!user) throw new UnauthorizedException()
    const ok = await this.users.validatePassword(user.passwordHash, data.password)
    if (!ok || user.active === false) throw new UnauthorizedException()
    const { passwordHash, ...safeUser } = user
    const payload = { 
      sub: user.id, ...safeUser
    }
    const accessToken = await this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET!, expiresIn: process.env.JWT_EXPIRES_IN || '15m' })
    const refreshToken = await this.jwt.signAsync(payload, { secret: process.env.REFRESH_SECRET!, expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' })
    return { accessToken, refreshToken }
  }

  async refresh(token: string) {
    try {
      const decoded = await this.jwt.verifyAsync(token, { secret: process.env.REFRESH_SECRET! })
      const payload = { ...decoded }
      const accessToken = await this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET!, expiresIn: process.env.JWT_EXPIRES_IN || '15m' })
      const refreshToken = await this.jwt.signAsync(payload, { secret: process.env.REFRESH_SECRET!, expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' })
      return { accessToken, refreshToken }
    } catch {
      throw new UnauthorizedException()
    }
  }

  async me(user: any) {
    return user
  }
}
