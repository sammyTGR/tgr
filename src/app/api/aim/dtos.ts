import { IReturn } from "@servicestack/client";

export interface SearchInventoryApiResult {
  Pk: number;
  Description?: string;
  InventoryType?: string;
  Manufacturer?: string;
  Model?: string;
  CategoryDescription?: string;
  SubCategoryDescription?: string;
  SelectionCode?: string;
  SelectionCodeDescription?: string;
  Sku?: string;
  Mpn?: string;
  CustomerPrice: number;
  Discontinued?: boolean;
}

export class SearchInventoryRequest
  implements IReturn<SearchInventoryResponse>
{
  ApiKey?: string;
  AppId?: string;
  SearchStr?: string;
  IncludeSerials?: boolean;
  IncludeMedia?: boolean;
  IncludeAccessories?: boolean;
  IncludePackages?: boolean;
  IncludeDetails?: boolean;
  IncludeIconImage?: boolean;
  ExactModel?: boolean;
  StartOffset?: number;
  RecordCount?: number;
  Cat?: string;
  Sub?: string;
  SelectionCode?: string;
  Mfg?: string;
  IncludeDeleted?: boolean;
  ChangedDate?: string;
  IncludePackageLineItems?: boolean;
  MinimumAvailableQuantity?: number;

  constructor(init?: Partial<SearchInventoryRequest>) {
    Object.assign(this, init);
  }

  getTypeName() {
    return "SearchInventory";
  }
  createResponse() {
    return new SearchInventoryResponse();
  }
}

export class SearchInventoryResponse {
  Status?: {
    StatusCode?: string;
    ErrorCode?: string;
    ErrorMessage?: string;
    ErrorDisplayText?: string;
    Login?: string;
    DomainName?: string;
    IpAddress?: string;
  };
  Records?: SearchInventoryApiResult[];
  TotalRecords?: number;
  StartOffset?: number;
  RecordCount?: number;
  RemainingRecords?: number;
}
