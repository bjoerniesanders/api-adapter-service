# API Adapter Service - Granulare API-Beispiele

Dieses Verzeichnis enthält sehr detaillierte, nach Funktionalität gruppierte API-Beispiele.

## 📁 Ordnerstruktur

```
api/
├── README.md                    # Diese Übersicht
├── core/                        # Kern-Funktionalitäten
│   ├── root.yaml               # Root-Endpoint
│   ├── health.yaml             # Health-Checks
│   └── documentation.yaml      # API-Dokumentation
├── adapters/                    # Adapter-Management
│   ├── list.yaml               # Adapter auflisten
│   ├── status.yaml             # Adapter-Status
│   ├── test.yaml               # Adapter testen
│   └── execute/                # API-Ausführung
│       ├── get.yaml            # GET-Requests
│       ├── post.yaml           # POST-Requests
│       ├── put.yaml            # PUT-Requests
│       ├── patch.yaml          # PATCH-Requests
│       └── delete.yaml         # DELETE-Requests
├── management/                  # Verwaltungs-Features
│   ├── config/                 # Konfiguration
│   │   ├── get.yaml           # Konfiguration abrufen
│   │   ├── put.yaml           # Vollständig aktualisieren
│   │   └── patch.yaml         # Teilweise aktualisieren
│   ├── webhooks/               # Webhook-Management
│   │   ├── register.yaml      # Webhook registrieren
│   │   ├── update.yaml        # Webhook aktualisieren
│   │   └── delete.yaml        # Webhook entfernen
│   └── cleanup/                # Aufräumen
│       ├── cache.yaml         # Cache löschen
│       ├── logs.yaml          # Logs löschen
│       └── sessions.yaml      # Sessions löschen
├── advanced/                    # Erweiterte Features
│   ├── batch.yaml             # Batch-Operationen
│   ├── metrics.yaml           # Metriken
│   └── monitoring.yaml        # Monitoring
└── tools/                      # Praktische Tools
    ├── curl-examples.sh       # cURL-Befehle
    └── postman-collection.json # Postman Collection
```

## 🚀 Schnellstart

### 1. Server starten
```bash
yarn dev
```

### 2. Beispiele verwenden

**Kern-Funktionalitäten:**
```bash
# Health-Checks
cat api/core/health.yaml

# Adapter auflisten
cat api/adapters/list.yaml
```

**API-Ausführung:**
```bash
# GET-Request über Adapter
cat api/adapters/execute/get.yaml

# POST-Request über Adapter
cat api/adapters/execute/post.yaml
```

**Verwaltung:**
```bash
# Konfiguration aktualisieren
cat api/management/config/patch.yaml

# Webhook registrieren
cat api/management/webhooks/register.yaml
```

## 📋 Verfügbare Kategorien

### **Core (Kern-Funktionalitäten)**
- **Root**: Willkommens-Endpoint
- **Health**: 4 verschiedene Health-Checks
- **Documentation**: OpenAPI, API-Info, Beispiele

### **Adapters (Adapter-Management)**
- **List**: Adapter auflisten
- **Status**: Adapter-Status abrufen
- **Test**: Adapter testen
- **Execute**: API-Anfragen ausführen (alle HTTP-Methoden)

### **Management (Verwaltung)**
- **Config**: Konfiguration verwalten
- **Webhooks**: Webhook-Management
- **Cleanup**: Aufräumen und Löschen

### **Advanced (Erweiterte Features)**
- **Batch**: Batch-Operationen
- **Metrics**: Metriken und Monitoring
- **Monitoring**: Erweiterte Überwachung

### **Tools (Praktische Tools)**
- **cURL**: 25 praktische Befehle
- **Postman**: Vollständige Collection

## 🔧 Verwendung

### **YAML-Format**
```yaml
# api/adapters/execute/get.yaml
get_users:
  method: POST
  url: "http://localhost:3000/api/v1/adapters/example-api/execute"
  headers:
    Content-Type: "application/json"
  body:
    request:
      method: "GET"
      url: "/users"
```

### **cURL-Format**
```bash
# Aus curl-examples.sh
curl -X POST http://localhost:3000/api/v1/adapters/example-api/execute \
  -H "Content-Type: application/json" \
  -d '{"request":{"method":"GET","url":"/users"}}'
```

## 💡 Vorteile der granulareren Struktur

### **Bessere Organisation**
- Logische Gruppierung nach Funktionalität
- Einfaches Finden spezifischer Beispiele
- Klare Trennung zwischen aktuellen und zukünftigen Features

### **Einfachere Wartung**
- Kleine, fokussierte Dateien
- Änderungen nur in relevanten Dateien
- Bessere Versionskontrolle

### **Flexiblere Verwendung**
```bash
# Nur Health-Checks
cat api/core/health.yaml

# Nur GET-Requests
cat api/adapters/execute/get.yaml

# Nur Verwaltungs-Features
cat api/management/config/patch.yaml
```

## 📚 Navigation

### **Nach Funktionalität**
- **Core**: Grundlegende API-Funktionen
- **Adapters**: Adapter-Management und -Ausführung
- **Management**: Verwaltungs- und Konfigurations-Features
- **Advanced**: Erweiterte und zukünftige Features
- **Tools**: Praktische Hilfsmittel

### **Nach HTTP-Methode**
- **GET**: Abrufen von Daten
- **POST**: Erstellen und Ausführen
- **PUT**: Vollständige Updates
- **PATCH**: Teilweise Updates
- **DELETE**: Löschen und Aufräumen

## 🔄 Automatisierung

### **Alle Health-Checks testen**
```bash
for file in api/core/health.yaml; do
  echo "Testing health endpoints from $file..."
  # Implementierung hier
done
```

### **Alle Adapter-Requests testen**
```bash
for file in api/adapters/execute/*.yaml; do
  echo "Testing adapter requests from $file..."
  # Implementierung hier
done
```

## 📖 Weitere Dokumentation

- [Haupt-README](../README.md) - Projektübersicht
- [TypeScript Client](../docs/typescript-client-usage.md) - Client-Generierung
- [API-Dokumentation](http://localhost:3000/docs) - Swagger UI 