import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { CurrentUser } from './current-user.decorator'
import { JwtAuthGuard } from './jwt-auth.guard'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService, private readonly jwt: JwtService) {}

  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        cpf: { type: 'string' },
        password: { type: 'string' }
      },
      required: ['password']
    }
  })
  async login(@Body() body: any) {
    return this.service.login(body)
  }

  @Post('refresh')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
      required: ['refreshToken']
    }
  })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.service.refresh(body.refreshToken)
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return user || {}
  }
}
