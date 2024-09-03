export type Service = {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE'
	path: string
}

export const REST_SCHEME: Record<string, Record<string, Service>> = {
	disk: {
		getDiskInfo: {
			method: 'GET',
			path: '/disk'
		}
	},
	resources: {
		getMetadata: {
			method: 'GET',
			path: '/disk/resources'
		},
		createDirectory: {
			method: 'PUT',
			path: '/disk/resources'
		}
	}
};
