import { Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  getProfile(@Headers('x-user-id') userIdHeader?: string) {
    const userId = userIdHeader || 'usr_demo_123';
    return this.accountService.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const userId = userIdHeader || 'usr_demo_123';
    return this.accountService.updateProfile(userId, dto);
  }

  @Get('preferences')
  getPreferences(@Headers('x-user-id') userIdHeader?: string) {
    const userId = userIdHeader || 'usr_demo_123';
    return this.accountService.getPreferences(userId);
  }

  @Patch('preferences')
  updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const userId = userIdHeader || 'usr_demo_123';
    return this.accountService.updatePreferences(userId, dto);
  }

  @Post('change-password')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const userId = userIdHeader || 'usr_demo_123';
    return this.accountService.changePassword(userId, dto);
  }

  @Post('logout-all')
  logoutAll(@Headers('x-user-id') userIdHeader?: string) {
    const userId = userIdHeader || 'usr_demo_123';
    return this.accountService.logoutAllDevices(userId);
  }
}
