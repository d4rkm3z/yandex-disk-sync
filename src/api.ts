import urlJoin from 'url-join';
import { requestUrl, RequestUrlParam } from 'obsidian';
import { ResponseErrors } from 'types/response-errors';
import { REST_SCHEME, Service } from 'src/rest-scheme';

type RequestProps = {
	service: Service,
	params?: string,
};

class Api {
	private baseUrl = '';
	private authToken = '';

	constructor(authToken: string, apiUrl = 'https://cloud-api.yandex.net', versionApi = 'v1') {
		this.baseUrl = urlJoin(apiUrl, versionApi)
		this.authToken = authToken;
	}

	async request(props: RequestProps) {
		const { path, method } = props.service;

		try {
			const url = urlJoin(this.baseUrl, path);
			const request = {
				url: props.params ? `${url}?${props.params}` : url,
				contentType: 'application/json',
				headers: {
					'Authorization': `OAuth ${this.authToken}`
				},
				method
			} as RequestUrlParam;

			return await requestUrl(request)
		} catch (err) {
			throw {
				message: ResponseErrors?.[err.status],
				code: err.status,
			} ?? err;
		}
	}

	async get(props: RequestProps) {
		return this.request(props);
	}

	async put(props: RequestProps) {
		return this.request(props)
	}

	post() {
	}
}

class Resources {
	protected api;

	constructor(api: Api) {
		this.api = api
	}

	async getMetadata() {
		return this.api.get({ service: REST_SCHEME.disk.getDiskInfo });
	}

	async getResourceInfo(path: string) {
		return this.api.get({
			service: REST_SCHEME.resources.getMetadata,
			params: `path=${path}`
		});
	}

	async createDirectory(path: string) {
		return this.api.put({
			service: REST_SCHEME.resources.createDirectory,
			params: `path=${path}`
		});
	}

	getUploadFileUrl() {
	}

	uploadFile() {
	}
}

export { Api, Resources };
