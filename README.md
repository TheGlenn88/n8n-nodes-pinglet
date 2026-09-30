# n8n-nodes-pinglet

This is an n8n community node for [Pinglet](https://pinglet.dev), a hosted webhook to push notification service. Publishing a message to a topic delivers a native push notification (APNs/FCM) to every phone subscribed to that topic.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation:

1. In n8n, go to **Settings** > **Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-pinglet` in the npm package name field.
4. Agree to the risks of using community nodes and select **Install**.

## Credentials

Create a **Pinglet API** credential with your API key (it starts with `pinglet_`). You can find or create keys in your Pinglet account at [pinglet.dev](https://pinglet.dev). The credential test calls the public `https://pinglet.dev/health` endpoint.

## Operations

### Message: Send

Publishes a message to `POST https://pinglet.dev/{namespace}/{topic}`. The topic is created automatically on first publish.

| Field | Required | Notes |
| --- | --- | --- |
| Namespace | Yes | Your namespace slug |
| Topic | Yes | 1 to 32 characters: `a-z`, `0-9`, `-` or `_`, starting and ending with a letter or digit |
| Message | Yes | Notification body text |
| Title | No | Defaults to the topic name when empty |
| Level | No | `info` (default), `success`, `warning` or `error`, controls display severity |
| Priority | No | `silent`, `normal` (default) or `urgent`, urgent breaks through Do Not Disturb |
| Badges | No | Up to 3 key/value pairs (keys up to 24 chars, values up to 32 chars) shown as badges |
| Data | No | Flat key/value payload (keys up to 64 chars, values up to 256 chars), Pro plans only, silently dropped on free plans |

The whole payload must stay under about 4 KB. The API responds with `message_id`, `topic`, `key`, `name`, `url` (the shareable subscription link), `subscribers`, `delivered` and `failed`.

## Usage example

Notify your phone when a deploy finishes:

1. Add a **Pinglet** node after your deploy step.
2. Select your **Pinglet API** credential.
3. Set **Namespace** to your namespace slug (for example `acme`) and **Topic** to `deploys`.
4. Set **Message** to something like `={{ "Deployed " + $json.version + " to production" }}`.
5. Set **Level** to `Success` and leave **Priority** on `Normal`.
6. Optionally add badges under **Additional Fields**, for example `env: production` and `version: {{ $json.version }}`.

Every phone subscribed to the topic's share link receives the push notification.

## Compatibility

Tested with n8n 1.x.

## Development

Built with the [`@n8n/node-cli`](https://www.npmjs.com/package/@n8n/node-cli) tooling:

```sh
npm install
npm run dev    # runs n8n locally with this node loaded, rebuilding on changes
npm run lint
npm run build
```

## Releasing

Pushing a version tag such as `1.0.2` runs `.github/workflows/publish.yml`, which builds the package and stages it on npm with a provenance statement (`npm stage publish`). The version goes live once a maintainer approves it with 2FA, from the package's **Staged Packages** tab on npmjs.com or with `npm stage approve <stage-id>`.

```sh
npm version patch --tag-version-prefix="" && git push --follow-tags
```

## Resources

* [Pinglet](https://pinglet.dev)
* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md), copyright Bitnix Limited.
