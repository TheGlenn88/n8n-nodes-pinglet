import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

interface KeyValuePair {
	key: string;
	value: string;
}

/**
 * Maps the fixedCollection key/value pairs from Additional Fields into the
 * flat "badges" and "data" objects the Pinglet API expects, and removes an
 * empty optional title so the API falls back to the topic name.
 */
async function prepareBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = (requestOptions.body ?? {}) as IDataObject;

	if (typeof body.title === 'string' && body.title.trim() === '') {
		delete body.title;
	}

	const additionalFields = this.getNodeParameter('additionalFields', {}) as IDataObject;

	for (const field of ['badges', 'data'] as const) {
		const collection = additionalFields[field] as IDataObject | undefined;
		const pairs = collection?.pair as KeyValuePair[] | undefined;
		if (pairs?.length) {
			const flat: IDataObject = {};
			for (const { key, value } of pairs) {
				flat[key] = value;
			}
			body[field] = flat;
		}
	}

	requestOptions.body = body;
	return requestOptions;
}

export class Pinglet implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pinglet',
		name: 'pinglet',
		icon: { light: 'file:../../icons/pinglet.svg', dark: 'file:../../icons/pinglet.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["topic"]}}',
		description: 'Send push notifications to your phone via Pinglet',
		defaults: {
			name: 'Pinglet',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'pingletApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://pinglet.dev',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': 'n8n-nodes-pinglet',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						action: 'Send a message',
						description: 'Publish a message to a topic and push it to every subscribed device',
						routing: {
							request: {
								method: 'POST',
								url: '=/{{$parameter["namespace"]}}/{{$parameter["topic"]}}',
							},
							send: {
								preSend: [prepareBody],
							},
						},
					},
				],
				default: 'send',
			},
			{
				displayName: 'Namespace',
				name: 'namespace',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. acme',
				description: 'Your Pinglet namespace slug',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Topic',
				name: 'topic',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. deploys',
				description:
					'Topic to publish to, created automatically on first publish. 1 to 32 characters: a-z, 0-9, hyphen or underscore, starting and ending with a letter or digit.',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				required: true,
				default: '',
				description: 'The notification body text',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'message',
					},
				},
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Notification title, defaults to the topic name when empty',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'title',
					},
				},
			},
			{
				displayName: 'Level',
				name: 'level',
				type: 'options',
				options: [
					{
						name: 'Error',
						value: 'error',
					},
					{
						name: 'Info',
						value: 'info',
					},
					{
						name: 'Success',
						value: 'success',
					},
					{
						name: 'Warning',
						value: 'warning',
					},
				],
				default: 'info',
				description: 'Display severity of the notification',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'level',
					},
				},
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{
						name: 'Normal',
						value: 'normal',
					},
					{
						name: 'Silent',
						value: 'silent',
					},
					{
						name: 'Urgent',
						value: 'urgent',
						description: 'Breaks through Do Not Disturb',
					},
				],
				default: 'normal',
				description: 'Delivery priority of the notification',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'priority',
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				options: [
					{
						displayName: 'Badges',
						name: 'badges',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						placeholder: 'Add Badge',
						default: {},
						description:
							'Short key/value pairs rendered as badges on the notification. Maximum 3 pairs, keys up to 24 characters, values up to 32 characters.',
						options: [
							{
								displayName: 'Badge',
								name: 'pair',
								values: [
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										default: '',
										description: 'Badge key, up to 24 characters',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Badge value, up to 32 characters',
									},
								],
							},
						],
					},
					{
						displayName: 'Data',
						name: 'data',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						placeholder: 'Add Data Field',
						default: {},
						description:
							'Custom key/value payload attached to the notification. Keys up to 64 characters, values up to 256 characters. Pro plans only, silently dropped on free plans.',
						options: [
							{
								displayName: 'Field',
								name: 'pair',
								values: [
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										default: '',
										description: 'Data key, up to 64 characters',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Data value, up to 256 characters',
									},
								],
							},
						],
					},
				],
			},
		],
	};
}
