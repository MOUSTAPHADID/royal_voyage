declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: 'test' | 'production';
    logLevel?: 'silent' | 'warn' | 'debug';
  }

  interface AmadeusResponse {
    data: any[];
    result: any;
    body: string;
  }

  class Amadeus {
    constructor(config: AmadeusConfig);
    shopping: {
      flightOffersSearch: {
        get(params: Record<string, string>): Promise<AmadeusResponse>;
        post(body: any): Promise<AmadeusResponse>;
      };
      hotelOffersSearch: {
        get(params: Record<string, string>): Promise<AmadeusResponse>;
      };
      flightOffers: {
        pricing: {
          post(body: any, params?: any): Promise<AmadeusResponse>;
        };
      };
    };
    referenceData: {
      locations: {
        get(params: Record<string, string>): Promise<AmadeusResponse>;
        hotels: {
          byCity: {
            get(params: Record<string, string>): Promise<AmadeusResponse>;
          };
        };
      };
    };
    booking: {
      flightOrders: {
        post(body: any): Promise<AmadeusResponse>;
      };
    };
    next(response: AmadeusResponse): Promise<AmadeusResponse | null>;
  }

  export default Amadeus;
}
