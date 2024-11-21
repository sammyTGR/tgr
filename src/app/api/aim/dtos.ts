import * as ServiceStack from '@servicestack/client';

// Base interfaces
export interface IReturn<T> {
    createResponse(): T;
}

export interface BaseResponse {
    Status?: ResponseStatus;
}

export class GetEndpointRequest implements IReturn<GetEndpointResponse> {
    ApiKey?: string;
    AppId?: string;
    Username?: string;
    Password?: string;

    constructor(init?: Partial<GetEndpointRequest>) {
        Object.assign(this, init);
    }

    createResponse() { return new GetEndpointResponse(); }
    getTypeName() { return 'GetEndpointRequest'; }
}

// Response class
export class GetEndpointResponse {
    Domain?: string;
    Token?: string;
    Status?: ResponseStatus;
}

export class ResponseStatus {
    ErrorCode?: string;
    Message?: string;
    StackTrace?: string;
    StatusCode?: string;
    ErrorMessage?: string;
}

// Base Request Classes
export class BaseRequest {
    ApiKey?: string;
    OAuthToken?: string;
}

export class BaseSecureRequest extends BaseRequest {
    Token?: string;
    DeviceId?: string;
    AppId?: string;
}

// Inventory Detail DTOs
export class InventoryDetailRequest extends BaseSecureRequest implements IReturn<InventoryDetailResponse> {
    Model?: string;
    SkipImages?: boolean;
    IncludeSerialInfo?: boolean;

    constructor(init?: Partial<InventoryDetailRequest>) {
        super();
        Object.assign(this, init);
    }

    createResponse() { return new InventoryDetailResponse(); }
    getTypeName() { return 'InventoryDetailRequest'; }
}

export class InventoryDetailResponse implements BaseResponse {
    Item?: InventoryItem;
    Status?: ResponseStatus;
}

// Inventory Lookup DTOs
export class InventoryLookupRequest extends BaseSecureRequest implements IReturn<InventoryLookupResponse> {
    Item?: string;
    LocationCode?: string;

    constructor(init?: Partial<InventoryLookupRequest>) {
        super();
        Object.assign(this, init);
    }

    createResponse() { return new InventoryLookupResponse(); }
    getTypeName() { return 'InventoryLookupRequest'; }
}

export class InventoryLookupResponse implements BaseResponse {
    Items?: InventoryItem[];
    Status?: ResponseStatus;
}

export interface BaseResponseResult {
    StatusCode?: string;
    Login?: string;
    ErrorCode?: string;
    ErrorDisplayText?: string;
    ErrorMessage?: string;
    DomainName?: string;
    IpAddress?: string;
}

// Search Inventory Types
export interface SearchInventoryApiResult {
    Description?: string;
    Model?: string;
    Mfg?: string;
    CategoryDescription?: string;
    SubCategoryDescription?: string;
    Sku?: string;
    CustomerPrice: number;
    // Add other fields as needed
}

export class SearchInventoryRequest extends BaseSecureRequest implements IReturn<SearchInventoryResponse> {
    LocFk?: number;
    MfgFk?: number;
    CatFk?: number;
    SubFk?: number;
    SelFk?: number;
    Cat?: number;
    Sub?: number;
    SelectionCode?: string;
    Mfg?: string;
    IncludeSerials?: boolean;
    IncludeMedia?: boolean;
    IncludeAccessories?: boolean;
    IncludePackages?: boolean;
    SearchStr?: string;
    ExactModel?: boolean;
    StartOffset?: number;
    RecordCount?: number;
    IncludeIconImage?: boolean;
    CatIdList?: number[];
    SubIdList?: number[];
    MfgIdList?: number[];
    SelIdList?: number[];
    IncludeDeleted?: boolean;
    ChangedDate?: Date;
    IncludePackageLineItems?: boolean;
    IncludeDetails?: boolean;
    MinimumAvailableQuantity?: number;

    constructor(init?: Partial<SearchInventoryRequest>) {
        super();
        Object.assign(this, init);
    }

    createResponse() { return new SearchInventoryResponse(); }
    getTypeName() { return 'SearchInventoryRequest'; }
}

export class SearchInventoryResponse implements BaseResponse {
    StartOffset: number = 0;
    RecordCount: number = 0;
    RemainingRecords: number = 0;
    TotalRecords: number = 0;
    Records?: SearchInventoryApiResult[];
    Status?: BaseResponseResult;
}

// Common Types
export class InventoryItem {
    ItemFk?: number;
    Model?: string;
    Description?: string;
    Quantity?: number;
    Available?: number;
    SerialNumber?: string;
    Location?: string;
    Category?: string;
    Subcategory?: string;
    Manufacturer?: string;
    PurchaseDate?: string;
    PurchasePrice?: number;
    LastModified?: string;
    IconImage?: string;
    Details?: any; // You can create a more specific type if needed
    Accessories?: any[]; // You can create a more specific type if needed
    Media?: any[]; // You can create a more specific type if needed
    Packages?: any[]; // You can create a more specific type if needed
}