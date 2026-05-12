import IBaseAddress from './IBaseAddress';

export default interface IShopLocation extends IBaseAddress {
  coordinates: {
    lat: number;
    lng: number;
  } | null;
}
