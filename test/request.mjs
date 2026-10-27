// A small reader of this node's declarative routing: given an operation and the parameters a user set, the request
// the description asks n8n to send. It covers only what this node uses (a request on the operation, query sends on
// top-level fields and on options the user added, and ={{ }} value expressions over $value), so that the test can
// compare it with a call that was recorded through RapidAPI.
export function requestFor(description, operation, params) {
	const op = description.properties.find((p) => p.name === 'operation').options.find((o) => o.value === operation);
	if (!op) throw new Error(`no operation ${operation}`);
	const qs = {};
	const send = (prop, value) => {
		const s = prop.routing?.send;
		if (!s || s.type !== 'query') return;
		qs[s.property] = typeof s.value === 'string' && s.value.startsWith('={{') ? evaluate(s.value, value) : value;
	};
	for (const prop of description.properties) {
		if (prop.name === 'operation') continue;
		if (prop.type === 'collection') {
			const set = params[prop.name] ?? {};
			for (const opt of prop.options) {
				if (!(opt.name in set)) continue;
				const only = opt.displayOptions?.show?.['/operation'];
				if (only && !only.includes(operation)) throw new Error(`option ${opt.name} is not shown for ${operation}`);
				send(opt, set[opt.name]);
			}
		} else if (prop.routing?.send) {
			send(prop, prop.name in params ? params[prop.name] : prop.default);
		}
	}
	const url = new URL(op.routing.request.url, description.requestDefaults.baseURL);
	for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, String(v));
	return { method: op.routing.request.method, url, headers: description.requestDefaults.headers, postReceive: op.routing.output?.postReceive ?? [] };
}

function evaluate(expr, $value) {
	const body = expr.replace(/^=\{\{/, '').replace(/\}\}$/, '');
	return new Function('$value', `return (${body});`)($value);
}

/** Query parameters as sorted pairs, so two URLs that ask the same question compare equal whatever the key order. */
export const pairs = (url) => [...new URL(url).searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
