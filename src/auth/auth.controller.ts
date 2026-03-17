import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser } from './current-user.decorator'

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
      properties: { refresh_token: { type: 'string' } },
      required: ['refresh_token']
    }
  })
  async refresh(@Body() body: { refresh_token: string }) {
    return this.service.refresh(body.refresh_token)
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: any) {
    return user || {}
  }
}
