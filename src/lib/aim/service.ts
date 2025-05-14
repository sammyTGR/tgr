import { JsonServiceClient } from "@servicestack/client";
import https from "https";
import fetch from "node-fetch";

interface EndpointResponse {
  NewEndpointDomain: string;
  NewEndpoint: string;
  OAuthToken: string;
}

interface SecurityResponse {
  Token: string;
}

export class AimService {
  private static instance: AimService;
  private client: JsonServiceClient | null = null;
  private endpointDomain: string | null = null;
  private oauthToken: string | null = null;
  private securityToken: string | null = null;

  private constructor() {}

  public static getInstance(): AimService {
    if (!AimService.instance) {
      AimService.instance = new AimService();
    }
    return AimService.instance;
  }

  private async getEndpoint(): Promise<EndpointResponse> {
    try {
      const baseUrl =
        process.env.AIM_API_URL ||
        "https://active-ewebservice.biz/aeServices30/api";
      const response = await fetch(`${baseUrl}/GetEndpoint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ApiKey: process.env.API_KEY,
          AppId: process.env.APP_ID,
        }),
        agent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true,
          maxSockets: 10,
          timeout: 10000,
        }),
      });

      if (!response.ok) {
        throw new Error(`GetEndpoint failed with status ${response.status}`);
      }

      return (await response.json()) as EndpointResponse;
    } catch (error: any) {
      console.error("GetEndpoint error:", error);
      throw new Error(`Failed to get endpoint: ${error.message}`);
    }
  }

  private async getSecurityToken(
    endpointDomain: string,
    oauthToken: string
  ): Promise<string> {
    try {
      const response = await fetch(`${endpointDomain}/api/GetSecurityToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          APIKey: process.env.API_KEY!,
          OAuthToken: oauthToken,
          AppId: process.env.APP_ID!,
        },
        body: JSON.stringify({
          UserName: process.env.USERNAME,
          Password: process.env.PASSWORD,
        }),
        agent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true,
          maxSockets: 10,
          timeout: 10000,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `GetSecurityToken failed with status ${response.status}`
        );
      }

      const securityResponse: SecurityResponse =
        (await response.json()) as SecurityResponse;
      return securityResponse.Token;
    } catch (error: any) {
      console.error("GetSecurityToken error:", error);
      throw new Error(`Failed to get security token: ${error.message}`);
    }
  }

  private async initializeClient(): Promise<JsonServiceClient> {
    try {
      // Step 1: Get endpoint and OAuth token
      const endpointResponse = await this.getEndpoint();
      this.endpointDomain = endpointResponse.NewEndpointDomain;
      this.oauthToken = endpointResponse.OAuthToken;

      // Step 2: Get security token
      this.securityToken = await this.getSecurityToken(
        this.endpointDomain,
        this.oauthToken
      );

      // Step 3: Create client with all required headers
      const client = new JsonServiceClient(this.endpointDomain);
      client.headers = new Headers({
        APIKey: process.env.API_KEY!,
        OAuthToken: this.oauthToken,
        AppId: process.env.APP_ID!,
        Token: this.securityToken,
      });

      return client;
    } catch (error: any) {
      console.error("Client initialization error:", error);
      throw new Error(`Failed to initialize client: ${error.message}`);
    }
  }

  public async getClient(): Promise<JsonServiceClient> {
    if (!this.client) {
      this.client = await this.initializeClient();
    }
    return this.client;
  }
}
