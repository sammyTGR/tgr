export interface IReturn<T> {
    createResponse(): T;
}

// @DataContract
export class BaseRequest {
    public ApiKey?: string;
    public OAuthToken?: string;

    public constructor(init?: Partial<BaseRequest>) { Object.assign(this, init); }
}

// @DataContract
export class BaseSecureRequest extends BaseRequest {
    public Token?: string;
    public DeviceId?: string;
    public AppId?: string;
    public OAuthToken?: string; // Add this line

    public constructor(init?: Partial<BaseSecureRequest>) { super(init); Object.assign(this, init); }
}

// @DataContract
export class BaseResponse {
    public Status?: BaseResponseResult;

    public constructor(init?: Partial<BaseResponse>) { Object.assign(this, init); }
}

// @DataContract
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

    public constructor(init?: Partial<InventoryDetailResponse>) { super(init); Object.assign(this, init); }
}

// @DataContract
export class InventoryDetailRequest extends BaseSecureRequest implements IReturn<InventoryDetailResponse> {
    public Pk?: number;
    public PkType?: string;
    public Model?: string;
    public SkipImages?: boolean;
    public IncludeSerialInfo?: boolean;
    public CustomerAcct?: number;

    public constructor(init?: Partial<InventoryDetailRequest>) { super(init); Object.assign(this, init); }
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

    public constructor(init?: Partial<InventoryLookupObj>) { Object.assign(this, init); }
}

// @DataContract
export class InventoryLookupResponse extends BaseResponse {
    public Results?: InventoryLookupObj[];

    public constructor(init?: Partial<InventoryLookupResponse>) { super(init); Object.assign(this, init); }
}

// @DataContract
export class InventoryLookupRequest extends BaseSecureRequest implements IReturn<InventoryLookupResponse> {
    public Item?: string;
    public LocationCode?: string;

    public constructor(init?: Partial<InventoryLookupRequest>) { super(init); Object.assign(this, init); }
    public getTypeName() { return 'InventoryLookupRequest'; }
    public getMethod() { return 'GET'; }
    public createResponse() { return new InventoryLookupResponse(); }
}

// Add BaseResponseResult if it's not defined elsewhere
export class BaseResponseResult {
    // Add properties as needed
}

// Additional classes that were referenced but not defined
export class ImageInfo {
    // Add properties as needed
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