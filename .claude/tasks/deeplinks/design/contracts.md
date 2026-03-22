# Контракты: Deeplinks

## apple-app-site-association (iOS)

Путь: `/.well-known/apple-app-site-association`
Content-Type: `application/json`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "97J2MY855C.com.factfront.app",
        "paths": ["NOT /api/*", "NOT /admin/*", "NOT /privacy-policy/*", "/*"]
      }
    ]
  }
}
```

## assetlinks.json (Android)

Путь: `/.well-known/assetlinks.json`
Content-Type: `application/json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.factfront.app",
      "sha256_cert_fingerprints": []
    }
  }
]
```

Примечание: `sha256_cert_fingerprints` нужно заполнить реальным fingerprint из signing key. Пока пустой массив — Android будет использовать fallback через intent filter с autoVerify.

## app.json изменения

### iOS — associatedDomains
```json
"associatedDomains": ["applinks:factfront.org"]
```

### Android — intentFilters
```json
"intentFilters": [
  {
    "action": "VIEW",
    "autoVerify": true,
    "data": [
      {
        "scheme": "https",
        "host": "factfront.org"
      }
    ],
    "category": ["BROWSABLE", "DEFAULT"]
  }
]
```

## share.ts — обновлённые URL

Все ссылки: `https://factfront.org` вместо `factfront.app` / `https://factfront.app`.
