import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

/**
 * The API answers { count, rowCap, items, fetchedAt, truncated? }. In 'rows' mode each row becomes one n8n item, and
 * when the answer was cut at the plan's row cap every row carries truncated: true, so the cut is never silent.
 * In 'response' mode the whole answer is one item.
 */
export function rowsFrom(body: unknown, mode: string): INodeExecutionData[] {
	const answer = (body ?? {}) as IDataObject;
	if (mode === 'response') return [{ json: answer }];
	const items = Array.isArray(answer.items) ? (answer.items as IDataObject[]) : [];
	const cut = answer.truncated === true;
	return items.map((row) => ({ json: cut ? { ...row, truncated: true } : row }));
}

export async function toRows(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const mode = this.getNodeParameter('output', 'rows') as string;
	return rowsFrom(response.body, mode);
}
