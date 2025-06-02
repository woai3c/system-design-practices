import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'

import { Public } from '../auth/decorators/public.decorator'
import { User } from '../auth/decorators/user.decorator'
import { ChangePasswordDto, ResetPasswordDto, ResetPasswordRequestDto, UpdateUserDto } from './user.dto'
import { UsersService } from './users.service'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @ApiOperation({ summary: 'Get users count' })
  @ApiResponse({ status: 200, description: 'Total users count' })
  @ApiBearerAuth()
  @Get('count')
  async getUsersCount() {
    const count = await this.usersService.getUsersCount()
    return { count }
  }

  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiBearerAuth()
  @Get('profile')
  async getCurrentUser(@User() user) {
    return this.usersService.findById(user.userId)
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id)
  }

  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto)
  }

  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Current password is incorrect' })
  @ApiBearerAuth()
  @Post(':id/change-password')
  changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto.currentPassword, changePasswordDto.newPassword)
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({ status: 200, description: 'Reset code sent if email exists' })
  @ApiBearerAuth()
  @Post('reset-password-request')
  requestPasswordReset(@Body() resetPasswordRequestDto: ResetPasswordRequestDto) {
    return this.usersService.createPasswordResetToken(resetPasswordRequestDto.email)
  }

  @ApiOperation({ summary: 'Reset password with code' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 409, description: 'Invalid or expired reset code' })
  @ApiBearerAuth()
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(resetPasswordDto.resetCode, resetPasswordDto.newPassword)
  }

  @Public()
  @ApiOperation({ summary: 'Get a public user profile' })
  @ApiResponse({ status: 200, description: 'Public user profile' })
  @Get('profile/:id')
  async getPublicProfile(@Param('id') id: string) {
    const user = await this.usersService.findById(id)

    return {
      id: user.id,
      displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0],
    }
  }
}
