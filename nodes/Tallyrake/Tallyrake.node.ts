import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { RAPIDAPI_HOST, USER_AGENT } from './constants';
import { toRows } from './rows';

const onlyFor = (...operations: string[]) => ({ show: { '/operation': operations } });

export class Tallyrake implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Trends (Tallyrake)',
		name: 'tallyrake',
		icon: { light: 'file:tallyrake.svg', dark: 'file:tallyrake.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Get Google Trends interest over time, interest by region and related queries as rows',
		defaults: {
			name: 'Google Trends (Tallyrake)',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'tallyrakeApi', required: true }],
		requestDefaults: {
			baseURL: `https://${RAPIDAPI_HOST}`,
			headers: {
				Accept: 'application/json',
				'User-Agent': USER_AGENT,
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Interest Over Time',
						value: 'interest',
						action: 'Get search interest over time',
						description: 'Get search interest over time for up to five terms',
						routing: {
							request: { method: 'GET', url: '/interest' },
							output: { postReceive: [toRows] },
						},
					},
					{
						name: 'Interest by Region',
						value: 'regions',
						action: 'Get search interest by region',
						description: 'Get search interest broken down by country, region or city',
						routing: {
							request: { method: 'GET', url: '/regions' },
							output: { postReceive: [toRows] },
						},
					},
					{
						name: 'Related Queries and Topics',
						value: 'related',
						action: 'Get related queries and topics',
						description: 'Get the queries and topics people searched alongside a term, top and rising',
						routing: {
							request: { method: 'GET', url: '/related' },
							output: { postReceive: [toRows] },
						},
					},
				],
				default: 'interest',
			},
			{
				displayName: 'Search Terms',
				name: 'terms',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. pickleball, padel',
				description: 'Up to five search terms, separated by commas',
				routing: {
					send: {
						type: 'query',
						property: 'terms',
						value: "={{ $value.split(',').map((t) => t.trim()).filter((t) => t).join(',') }}",
					},
				},
			},
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Rows',
						value: 'rows',
						description: 'One item per row of data',
					},
					{
						name: 'Full Response',
						value: 'response',
						description: 'One item holding the rows plus count, rowCap and truncated',
					},
				],
				default: 'rows',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Category',
						name: 'category',
						type: 'number',
						default: 0,
						description: 'Google Trends category ID. 0 means all categories.',
						displayOptions: onlyFor('interest'),
						routing: { send: { type: 'query', property: 'category' } },
					},
					{
						displayName: 'Compare Terms on One Scale',
						name: 'compare',
						type: 'boolean',
						default: false,
						description:
							'Whether to score all terms against one shared peak, so they can be compared. Off, each term is scored against its own peak.',
						displayOptions: onlyFor('interest'),
						routing: { send: { type: 'query', property: 'compare' } },
					},
					{
						displayName: 'Country',
						name: 'geo',
						type: 'string',
						default: '',
						placeholder: 'e.g. US',
						description: 'Two-letter country code. Leave empty for worldwide.',
						routing: { send: { type: 'query', property: 'geo' } },
					},
					{
						displayName: 'Resolution',
						name: 'resolution',
						type: 'options',
						options: [
							{ name: 'Country', value: 'COUNTRY' },
							{ name: 'Region', value: 'REGION' },
							{ name: 'City', value: 'CITY' },
						],
						default: 'COUNTRY',
						description: 'How finely to break down the regions',
						displayOptions: onlyFor('regions'),
						routing: { send: { type: 'query', property: 'resolution' } },
					},
					{
						displayName: 'Search Type',
						name: 'searchType',
						type: 'options',
						options: [
							{ name: 'Google Shopping', value: 'froogle' },
							{ name: 'Image Search', value: 'images' },
							{ name: 'News Search', value: 'news' },
							{ name: 'Web Search', value: '' },
							{ name: 'YouTube Search', value: 'youtube' },
						],
						default: '',
						description: 'Which Google search to measure',
						displayOptions: onlyFor('interest'),
						routing: { send: { type: 'query', property: 'searchType' } },
					},
					{
						displayName: 'Time Range',
						name: 'timeRange',
						type: 'string',
						default: 'today 12-m',
						placeholder: 'e.g. today 5-y',
						description:
							"Google Trends time range, e.g. 'now 7-d', 'today 3-m', 'today 12-m', 'today 5-y' or '2024-01-01 2024-12-31'",
						routing: { send: { type: 'query', property: 'timeRange' } },
					},
				],
			},
		],
	};
}
