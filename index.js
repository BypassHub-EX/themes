import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

/*
  Casual German Sender

  Add your DeepL API key here:
  - DeepL Free: keep https://api-free.deepl.com/v2/translate
  - DeepL Pro: change it to https://api.deepl.com/v2/translate

  To send without translating, start your message with:
  !raw your message
*/

const DEEPL_AUTH_KEY = "ADD_YOUR_DEEPL_API_KEY_HERE";
const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";

const RAW_PREFIX = "!raw ";
const MAX_LENGTH = 900;

let unpatch;
let warnedMissingKey = false;

function toast(message) {
  try {
    showToast(message);
  } catch {}
}

function getMessageObject(args) {
  for (const value of args) {
    if (value && typeof value === "object" && typeof value.content === "string") {
      return value;
    }
  }
  return null;
}

function getMessageIndex(args, messageObject) {
  return args.findIndex((value) => value === messageObject);
}

function stripRawPrefix(text) {
  const trimmed = text.trimStart();

  if (!trimmed.startsWith(RAW_PREFIX)) {
    return text;
  }

  const leadingSpaces = text.length - trimmed.length;
  return text.slice(0, leadingSpaces) + trimmed.slice(RAW_PREFIX.length);
}

function shouldSkipTranslation(text) {
  const msg = text.trim();

  if (!msg) return true;
  if (msg.startsWith(RAW_PREFIX)) return true;
  if (msg.startsWith("/")) return true;
  if (msg.startsWith("!") || msg.startsWith("?") || msg.startsWith("$")) return true;
  if (msg.startsWith("```") || msg.endsWith("```")) return true;
  if (/^https?:\/\/\S+$/i.test(msg)) return true;
  if (msg.length <= 1) return true;
  if (msg.length > MAX_LENGTH) return true;

  return false;
}

async function translateToCasualGerman(text) {
  if (!DEEPL_AUTH_KEY || DEEPL_AUTH_KEY === "ADD_YOUR_DEEPL_API_KEY_HERE") {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      toast("Casual German: add your DeepL API key first");
    }
    return text;
  }

  const body = new URLSearchParams();
  body.append("text", text);
  body.append("target_lang", "DE");
  body.append("formality", "prefer_less");

  const response = await fetch(DEEPL_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${DEEPL_AUTH_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`DeepL error ${response.status}`);
  }

  const data = await response.json();
  return data?.translations?.[0]?.text || text;
}

export const onLoad = () => {
  const MessageActions = findByProps("sendMessage");

  if (!MessageActions?.sendMessage) {
    toast("Casual German: sendMessage not found");
    return;
  }

  unpatch = instead("sendMessage", MessageActions, async (args, original) => {
    const messageObject = getMessageObject(args);

    if (!messageObject) {
      return original(...args);
    }

    const originalContent = messageObject.content;

    if (originalContent.trimStart().startsWith(RAW_PREFIX)) {
      const cleanContent = stripRawPrefix(originalContent);
      const index = getMessageIndex(args, messageObject);
      const newArgs = [...args];

      if (index !== -1) {
        newArgs[index] = {
          ...messageObject,
          content: cleanContent
        };

        return original(...newArgs);
      }

      return original(...args);
    }

    if (shouldSkipTranslation(originalContent)) {
      return original(...args);
    }

    try {
      const translatedContent = await translateToCasualGerman(originalContent);
      const index = getMessageIndex(args, messageObject);
      const newArgs = [...args];

      if (index !== -1) {
        newArgs[index] = {
          ...messageObject,
          content: translatedContent
        };

        return original(...newArgs);
      }

      return original(...args);
    } catch {
      toast("Casual German: translation failed, sent original");
      return original(...args);
    }
  });

  toast("Casual German Sender loaded");
};

export const onUnload = () => {
  try {
    unpatch?.();
  } catch {}

  unpatch = undefined;
  toast("Casual German Sender unloaded");
};
