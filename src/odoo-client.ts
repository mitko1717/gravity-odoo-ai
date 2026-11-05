type Domain = unknown[];

export class OdooError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

export class OdooClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  static fromEnv(): OdooClient {
    const url = process.env.ODOO_URL;
    const key = process.env.ODOO_API_KEY;
    if (!url || !key) throw new Error('ODOO_URL and ODOO_API_KEY must be set in .env');

    return new OdooClient(url, key);
  }

  async call<T>(model: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
    const endpoint = `${this.baseUrl}/json/2/${model}/${method}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    const text = await res.text();

    if (!res.ok) throw new OdooError(`${model}.${method} failed (${res.status})`, res.status, text);

    return JSON.parse(text) as T;
  }

  searchRead<T>(model: string, domain: Domain, fields: string[], limit?: number): Promise<T[]> {
    return this.call<T[]>(model, 'search_read', { domain, fields, limit });
  }

  search(model: string, domain: Domain): Promise<number[]> {
    return this.call<number[]>(model, 'search', { domain });
  }

  async create(model: string, values: Record<string, unknown>): Promise<number> {
    const ids = await this.call<number[]>(model, 'create', { vals_list: [values] });
    const [id] = ids;
    if (id === undefined) throw new Error(`${model}.create returned no id`);

    return id;
  }

  write(model: string, ids: number[], values: Record<string, unknown>): Promise<boolean> {
    return this.call<boolean>(model, 'write', { ids, vals: values });
  }
}
