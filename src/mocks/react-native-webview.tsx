// Web shim for react-native-webview (which has no web support).
// Renders the WebView's HTML/URI in an <iframe>, bridges postMessage in both
// directions, and exposes injectJavaScript — enough for the Leaflet maps.
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";

interface WebViewSource {
  html?: string;
  uri?: string;
}

interface WebViewProps {
  source?: WebViewSource;
  style?: unknown;
  onMessage?: (e: { nativeEvent: { data: string } }) => void;
  onLoad?: () => void;
  [key: string]: unknown;
}

// Lets the in-iframe code call window.ReactNativeWebView.postMessage(...).
const SHIM =
  "<script>window.ReactNativeWebView={postMessage:function(d){parent.postMessage(d,'*');}};</script>";

export const WebView = forwardRef<unknown, WebViewProps>(function WebView(
  { source, style, onMessage, onLoad },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useImperativeHandle(ref, () => ({
    injectJavaScript: (code: string) => {
      try {
        (iframeRef.current?.contentWindow as unknown as { eval: (c: string) => void } | undefined)?.eval(code);
      } catch { /* noop */ }
    },
  }), []);

  useEffect(() => {
    if (!onMessage) return;
    const onMsg = (e: MessageEvent) => {
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      onMessage({ nativeEvent: { data: String(e.data) } });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onMessage]);

  const flat = (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;
  const html = source?.html ? source.html.replace("<body>", "<body>" + SHIM) : undefined;

  return React.createElement("iframe", {
    ref: (el: HTMLIFrameElement | null) => { iframeRef.current = el; },
    ...(html ? { srcDoc: html } : { src: source?.uri }),
    onLoad,
    style: { border: 0, width: "100%", height: "100%", ...flat },
  });
});

export default WebView;
