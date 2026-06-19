# Casual German Sender

Kettu/Revenge/Vendetta-style plugin that converts your outgoing text into informal German before sending.

## Setup

1. Open `index.js`.
2. Replace:

```js
const DEEPL_AUTH_KEY = "ADD_YOUR_DEEPL_API_KEY_HERE";
```

with your DeepL API key.

3. If you use DeepL Free, keep:

```js
const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";
```

4. If you use DeepL Pro, change it to:

```js
const DEEPL_ENDPOINT = "https://api.deepl.com/v2/translate";
```

## Skip translation

Start a message with:

```txt
!raw your message here
```

The plugin removes `!raw ` and sends the rest normally.

## Upload to GitHub

Upload these files to your repo root:

- `manifest.json`
- `index.js`
- `README.md`

Then use the raw plugin/manifest URL in Kettu.
