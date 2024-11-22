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
    ItemFk?: number;
    Model?: string;
    Description?: string;
    CategoryDescription?: string;
    SubCategoryDescription?: string;
    Mfg?: string;
    CustomerPrice?: number;
    IconImage?: string;
    Quantity?: number;
    Available?: number;
    SerialNumber?: string;
    Location?: string;
    Category?: string;
    Subcategory?: string;
    PurchaseDate?: string;
    PurchasePrice?: number;
    LastModified?: string;
    Details?: any;
    Accessories?: any[];
    Media?: any[];
    Packages?: any[];
}

export class SearchInventoryRequest extends BaseSecureRequest implements IReturn<SearchInventoryResponse> {
    public LocFk?: number;
    public MfgFk?: number;
    public CatFk?: number;
    public SubFk?: number;
    public SelFk?: number;
    public Cat?: number;
    public Sub?: number;
    public SelectionCode?: string;
    public Mfg?: string;
    public IncludeSerials?: boolean;
    public IncludeMedia?: boolean;
    public IncludeAccessories?: boolean;
    public IncludePackages?: boolean;
    public SearchStr?: string;
    public ExactModel?: boolean;
    public StartOffset?: number;
    public RecordCount?: number;
    public IncludeIconImage?: boolean;
    public CatIdList?: number[];
    public SubIdList?: number[];
    public MfgIdList?: number[];
    public SelIdList?: number[];
    public IncludeDeleted?: boolean;
    public ChangedDate?: string;
    public IncludePackageLineItems?: boolean;
    public IncludeDetails?: boolean;
    public MinimumAvailableQuantity?: number;

    constructor(init?: Partial<SearchInventoryRequest>) {
        super();
        this.IncludeSerials = true;
        this.IncludeMedia = true;
        this.IncludeAccessories = true;
        this.IncludePackages = true;
        this.IncludeDetails = true;
        this.IncludeIconImage = true;
        this.StartOffset = 0;
        this.RecordCount = 50;
        
        if (init) {
            Object.assign(this, init);
        }
    }

    public getTypeName() { return 'SearchInventoryRequest'; }
    public getMethod() { return 'POST'; }
    public createResponse() { return new SearchInventoryResponse(); }
}

export class SearchInventoryResponse implements BaseResponse {
    StartOffset: number = 0;
    RecordCount: number = 0;
    RemainingRecords: number = 0;
    TotalRecords: number = 0;
    Records?: SearchInventoryApiResult[];
    Status?: ResponseStatus;
    NewEndpoint?: string;
    NewEndpointDomain?: string;
    OAuthToken?: string;
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

// Add this new interface for the endpoint response
export interface EndpointResponse {
    NewEndpoint: string;
    NewEndpointDomain: string;
    OAuthToken: string;
}