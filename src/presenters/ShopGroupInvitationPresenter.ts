import { IShopGroupInvitation } from '@/models/IShopGroupInvitation';

function normalizeObjectId(value: any): string {
  if (value == null) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in value && value._id != null) {
    return value._id.toString();
  }
  if (typeof value.toString === 'function') {
    return value.toString();
  }
  return String(value);
}

export function toShopGroupInvitationDto(invitation: any): IShopGroupInvitation {
  return {
    _id: normalizeObjectId(invitation._id),
    groupId: normalizeObjectId(invitation.groupId),
    invitedShopId: normalizeObjectId(invitation.invitedShopId),
    invitedByShopId: normalizeObjectId(invitation.invitedByShopId),
    status: invitation.status,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
}

export function toShopGroupInvitationDtos(invitations: any[]): IShopGroupInvitation[] {
  return invitations.map(toShopGroupInvitationDto);
}
