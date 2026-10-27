# n8n-nodes-tallyrake

An n8n community node for Google Trends data: interest over time, interest by region, and related queries and
topics, returned as rows your workflow can use straight away.

The node calls the Tallyrake Google Trends Data API on RapidAPI. The request runs on the API's infrastructure, so
your n8n instance never talks to Google itself, holds no cookies and opens no browser.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Reading the numbers](#reading-the-numbers) · [Usage](#usage) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
and install the package `n8n-nodes-tallyrake`.

## Credentials

You need a RapidAPI key with a subscription to the Google Trends Data API.

1. Open https://rapidapi.com/tallyrake/api/google-trends-data and subscribe to a plan.
2. Copy the key RapidAPI shows you (it is sent as the `x-rapidapi-key` header).
3. In n8n, create a **Tallyrake (RapidAPI) API** credential and paste the key into **RapidAPI Key**.

Saving the credential makes one small interest call to check the key.

## Operations

| Operation | Returns |
|---|---|
| **Interest Over Time** | search interest over time, one row per term per point |
| **Interest by Region** | search interest broken down by country, region or city |
| **Related Queries and Topics** | queries and topics people searched alongside a term, top and rising |

**Search Terms** takes up to five terms separated by commas, for example `pickleball, padel`.

Under **Options** you can add:

| Option | Applies to | Meaning |
|---|---|---|
| Time Range | all | Google Trends syntax: `now 7-d`, `today 3-m`, `today 12-m` (the default), `today 5-y`, or two dates like `2024-01-01 2024-12-31` |
| Country | all | a two-letter country code such as `US`; leave it out for worldwide |
| Category | Interest Over Time | a Google Trends category ID; 0 is all categories |
| Search Type | Interest Over Time | web, image, news, Google Shopping or YouTube search |
| Compare Terms on One Scale | Interest Over Time | put every term on one shared 0 to 100 scale |
| Resolution | Interest by Region | country, region or city |

Only the options you add are sent.

**Output** chooses the shape. **Rows** (the default) gives one n8n item per row, the same shape whether you asked
for one term or five, so it goes straight into a Google Sheet, a database or a Code node. **Full Response** gives
one item holding the rows together with `count`, `rowCap` and `truncated`.

Each plan returns up to a set number of rows per call (`rowCap`). When the data held more rows than your plan
allows, the rows past the cap are left out, and in Rows mode every row of that answer carries `truncated: true`, so
a cut answer is never silent.

## Reading the numbers

Interest values are Google's 0 to 100 index. **With Compare Terms on One Scale off (the default), each term is
scored against its own peak in the window you asked for**, so two terms in one answer are not comparable to each
other: in a recorded US answer for `pickleball, padel` over `today 12-m`, both terms reach 100, in different
weeks. Turn the option on when you want the terms on one shared scale, the way the Google Trends site shows a
comparison.

The same term over two different time ranges is not comparable either, because each window has its own peak.

## Usage

A weekly keyword report, in three nodes:

1. **Schedule Trigger**, every Monday.
2. **Google Trends (Tallyrake)**: Interest Over Time, Search Terms `pickleball, padel`, Options: Country `US`,
   Time Range `today 3-m`.
3. **Google Sheets**: Append Row, mapping `term`, `time`, `formattedTime` and `value`.

Each row has these fields: `type`, `term`, `geo`, `timeRange`, `time`, `formattedTime`, `value`, `isPartial`,
`fetchedAt` and `id`. `isPartial: true` marks the newest point while Google is still filling it in.

When Google rate-limits a request, the API answers `503` with a `Retry-After` header. To have n8n try again on its
own, open the node's **Settings**, turn on **Retry On Fail** and set **Wait Between Tries** to a few seconds. A
`401` means the key is missing, wrong or not subscribed, and a `429` means the plan's limit is reached.

Repeated identical questions are answered from the API's cache.

## Compatibility

Built with the n8n node CLI 0.54.3 against n8n nodes API version 1 and `n8n-workflow` 2.45.1. The package has no
runtime dependencies.

## Resources

- [Google Trends Data API on RapidAPI](https://rapidapi.com/tallyrake/api/google-trends-data)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

No telemetry: the node sends nothing anywhere except the API call you configure. Its requests carry the
User-Agent `n8n-nodes-tallyrake/<version>`.

MIT licensed. Questions: ops@tallyrake.com
