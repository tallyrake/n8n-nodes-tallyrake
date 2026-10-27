import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { RAPIDAPI_HOST, USER_AGENT } from '../nodes/Tallyrake/constants';

export class TallyrakeApi implements ICredentialType {
	name = 'tallyrakeApi';

	displayName = 'Tallyrake (RapidAPI) API';

	icon = 'file:../nodes/Tallyrake/tallyrake.svg' as const;

	documentationUrl = 'https://github.com/tallyrake/n8n-nodes-tallyrake?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'RapidAPI Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'The key RapidAPI shows you after you subscribe to the Google Trends Data API (any plan, including the free one)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-rapidapi-key': '={{$credentials.apiKey}}',
				'x-rapidapi-host': RAPIDAPI_HOST,
			},
		},
	};

	// One small interest call. A repeat of the same question is answered from the API's cache.
	test: ICredentialTestRequest = {
		request: {
			baseURL: `https://${RAPIDAPI_HOST}`,
			url: '/interest',
			qs: { terms: 'coffee' },
			headers: { 'User-Agent': USER_AGENT },
		},
	};
}
