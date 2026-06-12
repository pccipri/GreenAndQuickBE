export interface IShopGroupInvitation {
  _id: string;
  groupId: string;
  invitedShopId: string;
  invitedByShopId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}
