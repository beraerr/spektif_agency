import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteUserDto,
  UpdateUserRoleDto,
  CreateEmployeeDto,
} from './dto/organizations.dto';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user organizations' })
  findUserOrganizations(@Req() req) {
    return this.organizationsService.findUserOrganizations(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.organizationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Req() req,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto, req.user.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite user to organization' })
  inviteUser(
    @Param('id') id: string,
    @Body() inviteUserDto: InviteUserDto,
    @Req() req,
  ) {
    return this.organizationsService.inviteUser(id, inviteUserDto, req.user.id);
  }

  @Post(':id/employees')
  @ApiOperation({ summary: 'Create new employee in organization' })
  createEmployee(
    @Param('id') id: string,
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Req() req,
  ) {
    return this.organizationsService.createEmployee(id, createEmployeeDto, req.user.id);
  }

  @Get(':id/employees')
  @ApiOperation({ summary: 'Get all employees in organization' })
  getEmployees(
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.organizationsService.getEmployees(id, req.user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove user from organization' })
  removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    return this.organizationsService.removeUser(id, userId, req.user.id);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update user role in organization' })
  updateUserRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Req() req,
  ) {
    return this.organizationsService.updateUserRole(
      id,
      userId,
      updateRoleDto.role,
      req.user.id,
    );
  }
}
