export interface SearchParams {
  search: string;
  itemNumber: string;
  serial: string;
  manufacturer: string;
  model: string;
  type: string;
  caliber: string;
  location: string;
  condition: string;
  status: string;
  skip: number;
  take: number;
  dateRange?: string;
  customerInfo?: string;
  inventoryAsOf?: string;
  disposedStatus?: string;
  disposedType?: string;
  disposedToLicenseName?: string;
  disposedToFFL?: string;
  disposedToTradeName?: string;
  disposedToFirstName?: string;
  disposedToLastName?: string;
  disposedOrganizationName?: string;
  disposedToAddress1?: string;
  disposedToAddress2?: string;
  disposedToCity?: string;
  disposedToState?: string;
  disposedToZip?: string;
  disposedToCountry?: string;
  disposedToPhone?: string;
  disposedToEmail?: string;
  disposedToLicenseNumber?: string;
  disposedToFFLNumber?: string;
  disposedToTradeNumber?: string;
  disposedToLicenseState?: string;
  disposedToFFLState?: string;
  disposedToTradeState?: string;
  manufacturingDisposedType?: string;
  acquiredType?: string;
  manufacturingAcquiredType?: string;
  acquiredFromLicenseName?: string;
  acquiredFromFFL?: string;
  acquiredFromTradeName?: string;
  acquiredFromFirstName?: string;
  acquiredFromLastName?: string;
  acquiredOrganizationName?: string;
  acquiredFromAddress1?: string;
  acquiredFromAddress2?: string;
  acquiredFromCity?: string;
  acquiredFromState?: string;
  acquiredFromZip?: string;
  acquiredFromCountry?: string;
  acquiredFromPhone?: string;
  acquiredFromEmail?: string;
  acquiredFromLicenseNumber?: string;
  acquiredFromFFLNumber?: string;
  acquiredFromTradeNumber?: string;
  acquiredFromLicenseState?: string;
  acquiredFromFFLState?: string;
  acquiredFromTradeState?: string;
  deletedStatus?: string;
  doNotDisposeStatus?: string;
  acquiredOnAfter?: string;
  acquiredOnBefore?: string;
  disposedOnAfter?: string;
  disposedOnBefore?: string;
  searchTriggered?: boolean;
}

export interface InventoryItem {
  id: string;
  itemNumber: string;
  serial: string;
  manufacturer: string;
  model: string;
  type: string;
  caliber: string;
  location: string;
  condition: string;
  status: {
    id: number;
    name: string;
  };
}

export interface InventoryResponse {
  items: InventoryItem[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  records: number;
  itemsPerPage: number;
  skip: number;
  warning?: string;
}
