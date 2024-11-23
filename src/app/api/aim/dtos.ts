export interface IReturn<T> {
    createResponse(): T;
}

export class BaseResponse {
    public Status?: BaseResponseResult;

    constructor(init?: Partial<BaseResponse>) {
        Object.assign(this, init);
    }
}

export class BaseRequest {
    public ApiKey: string = '';
    public OAuthToken?: string;

    constructor(init?: Partial<BaseRequest>) {
        Object.assign(this, init);
    }
}

export class BaseSecureRequest extends BaseRequest {
    public Token?: string;
    public DeviceId?: string;
    public AppId: string = '';

    constructor(init?: Partial<BaseSecureRequest>) {
        super(init);
        Object.assign(this, init);
    }
}


export class InventoryDetailResponse extends BaseResponse {
    public SadPk?: number;
    public InvType?: string;
    public Model?: string;
    public Description?: string;
    public Mfg?: string;
    public Category?: number;
    public CategoryDescription?: string;
    public SubCategory?: number;
    public SubCategoryDescription?: string;
    public SelectionCode?: string;
    public SelectionCodeDescription?: string;
    public SellSerialsOnline?: boolean;
    public Notes?: string;
    public Images?: ImageInfo[];
    public HasImages?: boolean;
    public VariantDetails?: InventoryDetailByVariant[];
    public AddOns?: AddOnDetail[];
    public ActiveEInfo?: ActiveEInfo;
    public Weight?: number;
    public Unit?: string;
    public ShipCharge?: number;

    constructor(init?: Partial<InventoryDetailResponse>) {
        super(init);
        Object.assign(this, init);
    }
}


export class InventoryDetailRequest extends BaseSecureRequest implements IReturn<InventoryDetailResponse> {
    public Pk?: number;
    public PkType?: string;
    public Model?: string;
    public SkipImages?: boolean;
    public IncludeSerialInfo?: boolean;
    public CustomerAcct?: number;

    constructor(init?: Partial<InventoryDetailRequest>) {
        super(init);
        Object.assign(this, init);
    }
    public getTypeName() { return 'InventoryDetailRequest'; }
    public getMethod() { return 'POST'; }
    public createResponse() { return new InventoryDetailResponse(); }
}

// @DataContract
export class InventoryLookupObj {
    public ResultType?: string;
    public Sku?: string;
    public Serial?: string;
    public Category?: number;
    public SubCategory?: number;
    public Description?: string;
    public ComputerQty?: number;
    public AvailableQty?: number;
    public SadPk?: number;
    public SkuPk?: number;
    public SasPk?: number;
    public InventoryType?: string;
    public NicsPrice?: number;
    public ADBookItem?: boolean;
    public LocationCode?: string;

    constructor(init?: Partial<InventoryLookupObj>) {
        Object.assign(this, init);
    }
}

// @DataContract
export class InventoryLookupResponse extends BaseResponse {
    public Results?: InventoryLookupObj[];

    constructor(init?: Partial<InventoryLookupResponse>) {
        super(init);
        Object.assign(this, init);
    }
}

// @DataContract
export class InventoryLookupRequest extends BaseSecureRequest implements IReturn<InventoryLookupResponse> {
    public Item?: string;
    public LocationCode?: string;

    constructor(init?: Partial<InventoryLookupRequest>) {
        super(init);
        Object.assign(this, init);
    }
    public getTypeName() { return 'InventoryLookupRequest'; }
    public getMethod() { return 'GET'; }
    public createResponse() { return new InventoryLookupResponse(); }
}

// Add BaseResponseResult if it's not defined elsewhere
export class BaseResponseResult {
    public StatusCode?: string;
    public Login?: string;
    public ErrorCode?: string;
    public ErrorDisplayText?: string;
    public ErrorMessage?: string;
    public DomainName?: string;
    public IpAddress?: string;

    constructor(init?: Partial<BaseResponseResult>) {
        Object.assign(this, init);
    }
}

// Additional classes that were referenced but not defined
export class ImageInfo {
    // Add properties for ImageInfo if needed
    constructor(init?: Partial<ImageInfo>) {
        Object.assign(this, init);
    }
}

export class InventoryDetailByVariant {
    // Add properties as needed
}

export class AddOnDetail {
    // Add properties as needed
}

export class ActiveEInfo {
    // Add properties as needed
}

// Define or import InventoryDetail if it's defined elsewhere
// For now, we'll define it as an interface with some sample properties
export interface InventoryDetail {
    // Add properties as needed
    id: number;
    name: string;
    Description?: string;
    Mfg?: string;
    Model?: string;
    CategoryDescription?: string;
    SubCategoryDescription?: string;
    Sku?: string;
}

export class SearchInventoryRequest extends BaseSecureRequest implements IReturn<SearchInventoryResponse> {
    public SearchStr?: string;
    public StartOffset?: number;
    public RecordCount?: number;

    constructor(init?: Partial<SearchInventoryRequest>) {
        super(init);
        Object.assign(this, init);
    }
    public getTypeName() { return 'SearchInventoryRequest'; }
    public getMethod() { return 'POST'; }
    public createResponse() { return new SearchInventoryResponse(); }
}

export class SearchInventoryResponse extends BaseResponse {
    public StartOffset: number = 0;
    public RecordCount: number = 0;
    public RemainingRecords: number = 0;
    public TotalRecords: number = 0;
    public Records?: SearchInventoryApiResult[];

    constructor(init?: Partial<SearchInventoryResponse>) {
        super(init);
        Object.assign(this, init);
    }
}

export class SearchInventoryApiResult {
    public Detail?: InventoryDetail;
    public IconImage?: ImageInfo;
    public CustomerPrice: number = 0;

    constructor(init?: Partial<SearchInventoryApiResult>) {
        Object.assign(this, init);
    }
}