import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class PingletApi implements ICredentialType {
	name = 'pingletApi';

	displayName = 'Pinglet API';

	icon: Icon = { light: 'file:../icons/pinglet.svg', dark: 'file:../icons/pinglet.dark.svg' };

	documentationUrl = 'https://pinglet.dev';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Pinglet API key, it starts with "pinglet_"',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://pinglet.dev',
			url: '/health',
			method: 'GET',
		},
	};
}
