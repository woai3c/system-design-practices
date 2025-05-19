import { Body, Controller, NotFoundException, Post, Request, Response, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { LoginUserDto } from '../users/user.dto'
import { AuthService } from './auth.service'
import { COOKIE_OPTIONS, TOKEN_DURATION } from './constants'
import { User } from './decorators/user.decorator'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { LocalAuthGuard } from './guards/local-auth.guard'

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens and user data' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@User() user, @Request() req, @Response({ passthrough: true }) res) {
    // Pass user agent, IP address and response object for cookie setting
    return this.authService.login(user, req.headers['user-agent'], req.ip, res)
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiCookieAuth('refresh_token')
  @ApiBearerAuth()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Request() req, @Response({ passthrough: true }) res) {
    // Try to get refresh token from cookie if not provided in body
    const refreshToken = refreshTokenDto.refreshToken || req.cookies.refresh_token
    const sessionId = refreshTokenDto.sessionId || req.cookies.session_id

    if (!refreshToken || !sessionId) {
      throw new NotFoundException('Refresh token and session ID are required')
    }

    const result = await this.authService.refreshToken(sessionId, refreshToken)

    // Update access token and refresh token cookies
    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: TOKEN_DURATION.ACCESS_TOKEN,
    })

    // Update the refresh token cookie with the new token
    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      path: '/auth/refresh-token',
      maxAge: TOKEN_DURATION.REFRESH_TOKEN,
    })

    return result
  }

  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiBearerAuth()
  @ApiCookieAuth('access_token')
  @Post('logout')
  async logout(@User('sub') sessionId, @Request() req, @Response({ passthrough: true }) res) {
    // Clear cookies
    res.clearCookie('access_token')
    res.clearCookie('refresh_token', { path: '/auth/refresh-token' })
    res.clearCookie('session_id')

    return this.authService.logout(sessionId || req.cookies.session_id)
  }

  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices successfully' })
  @ApiBearerAuth()
  @Post('logout-all')
  async logoutAll(@User('userId') userId) {
    return this.authService.logoutAll(userId)
  }
}
