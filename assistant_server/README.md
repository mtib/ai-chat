# Assistant server

This is the server model to add custom hosted assistants to ai-chat.

Note: the server doesn't actually do any AI prompt completions, instead it does *just* the following, and nothing more:

- serve a system prompt
- accept a pair of embeddings and data to store
- serve a list of data to add to a prompt given a prompt embedding

All of this happens over the following REST endpoints.

## Endpoints

All endpoints are authorized by a preshared token, provided via the `Authorization` header as `Bearer <token>`.

### GET /config

Serves JSON:

```json
{
    "prompt": "<system prompt to use for new conversations>",
    "size": <number of pairs of embeddings and data>, // allowed to be outdated / estimate
    "description": "<a paragraph long description of what this assistant is meant for>",
    "short_description": "<one-line description of this assistant>",
    "embedding": "<enum value representing the embedding, like 'text-embedding-3-small'>"
}
```

### PUT /data

With this body:

```json
{
    "embedding": [
        -0.006929283495992422,
        -0.005336422007530928,
        -4.547132266452536e-05,
        -0.024047505110502243
    ],
    "payload": "<some text that matches that embedding>"
}
```

### POST /search

With this body:

```json
{
    "embedding": [
        -0.006929283495992422,
        -0.005336422007530928,
        -4.547132266452536e-05,
        -0.024047505110502243
    ],
}
```

and get the response of shape:

```json
{
    "payload": [
        "<payload1>",
        "<payload2>",
        // ...
    ]
}
```

Where the payloads are the strings provided to the PUT endpoint earlier that are closest to the provided embedding.
The assistant server decides how many payloads to use, what the measure and threshold is, and which order the payloads are returned in.
